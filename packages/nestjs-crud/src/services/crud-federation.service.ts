import { PlainLiteralObject } from '@nestjs/common';

import { CrudRequestInterface } from '../crud/interfaces/crud-request.interface';
import { CrudResponsePaginatedInterface } from '../crud/interfaces/crud-response-paginated.interface';
import {
  CRUD_FEDERATION_DEFAULT_LIMIT,
  CRUD_FEDERATION_DEFAULT_PAGE,
  CRUD_RELATION_CARDINALITY_ONE,
  CRUD_RELATION_CARDINALITY_MANY,
  CRUD_FEDERATION_INITIAL_TOTAL,
  CRUD_FEDERATION_INITIAL_FETCH_COUNT,
} from '../crud.constants';
import { CrudFederationException } from '../exceptions/crud-federation.exception';
import {
  QueryFilter,
  QueryRelation,
  QuerySort,
  QuerySortOperator,
  CondOperator,
} from '../request/types/crud-request-query.types';

import { CrudRelationRegistry } from './crud-relation.registry';
import { CrudQueryHelper } from './helpers/crud-query.helper';
import { CrudSearchHelper } from './helpers/crud-search.helper';
import { CrudFederationFetchOptionsInterface } from './interfaces/crud-federation-fetch-options.interface';
import { CrudFetchServiceInterface } from './interfaces/crud-fetch-service.interface';
import { CrudRelationBindingInterface } from './interfaces/crud-relation-binding.interface';

export class CrudFederationService<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  private readonly relationQueryHelper = new CrudQueryHelper<
    Relations[number]
  >();
  private readonly rootSearchHelper = new CrudSearchHelper<Root>();
  private readonly relationSearchHelper = new CrudSearchHelper<
    Relations[number]
  >();

  constructor(
    private readonly rootService: CrudFetchServiceInterface<Root>,
    private readonly relationRegistry?: CrudRelationRegistry<Root, Relations>,
  ) {}

  /**
   * Get relation bindings for relation configurations.
   * Throws error if relations are configured but no registry is available.
   */
  private getRelationBindings(
    req: CrudRequestInterface<Root>,
  ): CrudRelationBindingInterface<Root, Relations[number]>[] {
    const relations = req.options?.query?.relations?.relations;

    if (!relations || relations.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return [];
    }

    if (!this.relationRegistry) {
      const relationNames = relations.map((r) => r.property).join(', ');
      throw new CrudFederationException({
        message:
          'Relation registry is required when relations are configured: %s. Inject CrudRelationRegistry in the CrudService constructor.',
        messageParams: [relationNames],
      });
    }

    return this.relationRegistry.getBindings(relations);
  }

  /** Validate that search and or filters via query string are not supported */
  private validateUnsupportedQueryFeatures<T extends PlainLiteralObject>(
    req: CrudRequestInterface<T>,
  ): void {
    // check if search conditions exist via query string
    if (req.parsed.search) {
      throw new CrudFederationException({
        message:
          'Search via query string is not supported in CRUD federation. ' +
          'Use filter conditions instead.',
      });
    }

    // check if OR conditions exist via query string
    if (req.parsed.or && req.parsed.or.length > CRUD_FEDERATION_INITIAL_TOTAL) {
      throw new CrudFederationException({
        message:
          'OR filter via query string is not supported in CRUD federation. ' +
          'Use AND filter conditions instead.',
      });
    }
  }

  /** Inject CondOperator.NOT_NULL filters for relations with join: 'INNER' to enforce INNER JOIN semantics */
  private injectInnerJoinFilters<T extends PlainLiteralObject>(
    req: CrudRequestInterface<T>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): void {
    // only process relations that require INNER JOIN
    const innerJoinRelations = relations.filter(
      (relationBinding) => relationBinding.relation.join === 'INNER',
    );

    if (innerJoinRelations.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return; // No INNER JOIN relations
    }

    // ensure filter array exists
    if (!req.parsed.filter) {
      req.parsed.filter = [];
    }

    for (const relationBinding of innerJoinRelations) {
      const { relation } = relationBinding;
      const relationProperty = relation.property;

      // determine the foreign key field based on relationship direction
      const foreignKeyField = relation.foreignKey;

      // check if CondOperator.NOT_NULL filter already exists for this field
      const existingNotNullFilter = req.parsed.filter.find(
        (filter) =>
          filter.field === foreignKeyField &&
          filter.operator === CondOperator.NOT_NULL,
      );

      if (!existingNotNullFilter) {
        // inject CondOperator.NOT_NULL filter to enforce INNER JOIN semantics
        req.parsed.filter.push({
          field: foreignKeyField,
          operator: CondOperator.NOT_NULL,
          relation: relation.owner ? undefined : relationProperty,
        });
      }
    }
  }

  /**
   * Main federation method - uses hybrid strategy based on sort and relation requirements
   *
   * Strategy Selection:
   * - ROOT_SORT with no relations: Direct root fetch
   * - ROOT_SORT with relations: LEFT JOIN (root-first) vs INNER JOIN (relation-first) based on filters
   * - RELATION_SORT: Relation-first with sorted constraint propagation
   *
   * @param req - CRUD request with parsed filters, sorts, and pagination
   * @param options - Optional fetch options including metrics collection
   * @returns Paginated response with hydrated relations and optional performance metrics
   */
  async getMany(
    req: CrudRequestInterface<Root>,
    options?: CrudFederationFetchOptionsInterface,
  ): Promise<CrudResponsePaginatedInterface<Root>> {
    const { includeMetrics = false } = options || {};

    const startTime = Date.now();

    // extract relation configurations from relations
    const relations = this.getRelationBindings(req);

    // automatically inject CondOperator.NOT_NULL filters for INNER join relations
    this.injectInnerJoinFilters(req, relations);

    // validation: reject unsupported search and or filters via query string
    this.validateUnsupportedQueryFeatures(req);

    // Cache root key once for this request to avoid repeated validation
    const rootKey =
      relations.length > CRUD_FEDERATION_INITIAL_TOTAL
        ? this.getRootKey(req)
        : '';

    let totalFetched = CRUD_FEDERATION_INITIAL_TOTAL;
    let fetchCalls = CRUD_FEDERATION_INITIAL_FETCH_COUNT;
    let resultRoots: Root[] = [];
    let allRelationResults: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total?: number;
    }> = [];
    let accurateTotal = CRUD_FEDERATION_INITIAL_TOTAL;

    // Analyze sort requirements to determine optimal strategy
    const sortAnalysis = this.analyzeSortRequirements(req, relations);

    // Initialize rootReq
    const rootReq = req;

    switch (sortAnalysis.type) {
      case SortStrategyType.RELATION_SORT:
        // Use relation-sort strategy for proper ordering
        const relationSortResult = await this.fetchWithRelationSort(
          rootReq,
          relations,
          sortAnalysis,
          rootKey,
        );
        resultRoots = relationSortResult.sortedRoots;
        allRelationResults = relationSortResult.allRelationResults;
        accurateTotal = relationSortResult.accurateTotal;
        fetchCalls += relationSortResult.fetchCalls;
        totalFetched += relationSortResult.totalFetched;
        break;

      case SortStrategyType.ROOT_SORT:
      default:
        // Handle no relations case
        if (relations.length === CRUD_FEDERATION_INITIAL_TOTAL) {
          const noRelationResult = await this.handleNoRelationsCase(rootReq);
          resultRoots = noRelationResult.roots;
          accurateTotal = noRelationResult.total;
          fetchCalls += noRelationResult.fetchCalls;
          totalFetched += noRelationResult.totalFetched;
          allRelationResults = [];
        } else {
          // Determine JOIN behavior based on presence of relation filters
          const applyInnerJoin = this.shouldApplyInnerJoin(rootReq, relations);

          let shouldFetchRoots = true;
          let rootIdConstraints: unknown[] = [];
          allRelationResults = [];

          if (applyInnerJoin) {
            // INNER JOIN: Use relation-first strategy when relation filters exist
            const relationDiscovery = await this.fetchAllRelationsForEnrichment(
              {
                req: rootReq,
                relations,
              },
            );

            fetchCalls += relationDiscovery.fetchCalls;
            totalFetched += relationDiscovery.totalFetched;
            // Extract root IDs from relation discovery, preserving order for INNER JOIN constraints
            const allRootIds = relationDiscovery.allRelationResults.flatMap(
              (relationResult) => relationResult.rootIds || [],
            );
            rootIdConstraints = this.deduplicatePreservingOrder(allRootIds);

            if (rootIdConstraints.length === CRUD_FEDERATION_INITIAL_TOTAL) {
              // No matching relations found - return empty result immediately
              resultRoots = [];
              accurateTotal = CRUD_FEDERATION_INITIAL_TOTAL;
              shouldFetchRoots = false;
            }

            allRelationResults = relationDiscovery.allRelationResults.map(
              (result) => ({
                config: result.config,
                data: result.data,
                total: result.total,
              }),
            );
          } else {
            // LEFT JOIN: Use root-first strategy for optimal performance
            const leftJoinResult = await this.handleLeftJoinCase(
              rootReq,
              relations,
              rootKey,
            );
            resultRoots = leftJoinResult.roots;
            accurateTotal = leftJoinResult.total;
            fetchCalls += leftJoinResult.fetchCalls;
            totalFetched += leftJoinResult.totalFetched;
            allRelationResults.push(...leftJoinResult.relationResults);
            shouldFetchRoots = false; // Already fetched
          }

          // Fetch roots if needed (both LEFT JOIN and INNER JOIN with matches)
          if (shouldFetchRoots) {
            if (
              applyInnerJoin &&
              rootIdConstraints.length > CRUD_FEDERATION_INITIAL_TOTAL
            ) {
              // Apply INNER JOIN constraints and get ordered results
              const constrainedResult = await this.applyInnerJoinConstraints(
                rootReq,
                rootKey,
                rootIdConstraints,
              );
              resultRoots = constrainedResult.roots;
              accurateTotal = constrainedResult.total;
              fetchCalls += constrainedResult.fetchCalls;
              totalFetched += constrainedResult.totalFetched;
            } else {
              // LEFT JOIN: fetch all roots without constraints
              this.rootSearchHelper.buildSearch(rootReq);

              const rootResult = await this.rootService.getMany(rootReq);
              resultRoots = rootResult.data;
              accurateTotal = rootResult.total || rootResult.count;
              fetchCalls += 1;
              totalFetched += resultRoots.length;
            }
          }
        }
        break;
    }

    // Always return roots even if accurateTotal === 0
    // Empty roots means the root service returned empty, not that relations are empty

    // Hydrate relationships using pre-fetched relation data
    if (
      resultRoots.length > CRUD_FEDERATION_INITIAL_TOTAL &&
      allRelationResults.length > CRUD_FEDERATION_INITIAL_TOTAL
    ) {
      const allRelationArrays = allRelationResults.map((result) => result.data);

      this.hydrateRelations(rootKey, resultRoots, relations, allRelationArrays);
    } else if (resultRoots.length > CRUD_FEDERATION_INITIAL_TOTAL) {
      // Initialize empty relations for roots when no relations exist
      this.initializeEmptyRelations(resultRoots, relations);
    }

    // Return result with accurate pagination metadata and optional metrics
    return this.buildFinalResponse(
      resultRoots,
      accurateTotal,
      rootReq,
      includeMetrics,
      {
        totalFetched,
        fetchCalls,
        duration: Date.now() - startTime,
      },
    );
  }

  /** Helper: Deduplicate array while preserving order of first occurrences */
  private deduplicatePreservingOrder<T>(items: T[]): T[] {
    if (items.length <= 1) return items;

    const seen = new Set<T>();
    const result: T[] = [];

    for (const item of items) {
      if (item !== null && item !== undefined && !seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }

    return result;
  }

  /** Helper: Re-order roots to match the specified ID order */
  private reorderRootsByIds(
    fetchedRoots: Root[],
    orderedIds: unknown[],
    rootKey: keyof Root,
  ): Root[] {
    // create map for O(1) lookup
    const rootMap = new Map<unknown, Root>();
    for (const root of fetchedRoots) {
      rootMap.set(root[rootKey], root);
    }

    // map ordered IDs to roots and filter out undefined results
    const mappedRoots: (Root | undefined)[] = orderedIds.map((id) =>
      rootMap.get(id),
    );
    const validRoots: Root[] = mappedRoots.filter(
      (root): root is Root => root !== undefined,
    );
    return this.deduplicatePreservingOrder(validRoots);
  }

  /** Single entity fetching with relation hydration */
  async getOne(req: CrudRequestInterface<Root>): Promise<Root> {
    // extract relation configurations from relations
    const relations = this.getRelationBindings(req);

    // create root request
    const rootReq = req;

    // build search conditions before calling service
    this.rootSearchHelper.buildSearch(rootReq);

    // fetch the root entity first
    const root = await this.rootService.getOne(rootReq);

    // if no relations requested, return root as-is
    if (relations.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return root;
    }

    // fetch relations for the single root entity
    const relationArrays = await this.fetchRelationsForSingleRoot(
      root,
      relations,
    );

    // hydrate relations for the single root entity
    const rootKey = this.getRootKey(rootReq);
    this.hydrateRelations(rootKey, [root], relations, relationArrays);

    return root;
  }

  /** Helper: Fetch relations for a single root entity */
  private async fetchRelationsForSingleRoot(
    root: Root,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): Promise<Relations[number][][]> {
    const relationPromises = relations.map(
      async (
        relationBinding: CrudRelationBindingInterface<Root, Relations[number]>,
      ): Promise<Relations[number][]> => {
        const relation = relationBinding.relation;

        // extract constraint value based on relationship direction
        const constraintValue = relation.owner
          ? root[relation.foreignKey] // Inverse: root's foreign key
          : root[relation.primaryKey]; // Forward: root's primary key

        if (constraintValue == null) {
          return [];
        }

        // use the helper method with a single constraint value
        return this.fetchRelationsWithConstraints(relationBinding, [
          constraintValue,
        ]);
      },
    );

    return Promise.all(relationPromises);
  }

  private addConstraintFilter<Entity extends PlainLiteralObject>(
    req: CrudRequestInterface<Entity>,
    field: string,
    values: unknown[],
    relation?: string,
  ): void {
    if (values.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return; // No constraints to add
    }

    if (values.length === CRUD_FEDERATION_DEFAULT_PAGE) {
      // single value: use CondOperator.EQUALS operator
      req.parsed.filter.push({
        field,
        operator: CondOperator.EQUALS,
        value: values[0],
        relation,
      });
    } else {
      // multiple values: use CondOperator.IN operator
      req.parsed.filter.push({
        field,
        operator: CondOperator.IN,
        value: values,
        relation,
      });
    }
  }

  /**
   * Fetch relations for a given relationship configuration and constraint values
   *
   * @param relationBinding - The relation configuration
   * @param constraintValues - Values to constrain the query (root IDs for forward, foreign keys for inverse)
   * @param relationFilters - Filters to apply to the relation query
   * @param relationOrFilters - OR filters to apply to the relation query
   * @returns Promise resolving to relation data array
   */
  private async fetchRelationsWithConstraints(
    relationBinding: CrudRelationBindingInterface<Root, Relations[number]>,
    constraintValues: unknown[] = [],
    relationFilters: QueryFilter<Root>[] = [],
    relationOrFilters: QueryFilter<Root>[] = [],
  ): Promise<Relations[number][]> {
    if (constraintValues.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return [];
    }

    const relation = relationBinding.relation;

    // create relation request with filters
    const relationReq = this.createFilteredRelationRequest({
      filters: relationFilters,
      orFilters: relationOrFilters,
      relationProperty: relation.property,
    });

    // add constraint filter based on relationship direction
    const fieldName = relation.owner
      ? relation.primaryKey
      : relation.foreignKey;
    this.addConstraintFilter(
      relationReq,
      fieldName,
      constraintValues,
      relation.property,
    );

    // build search conditions before calling service
    this.relationSearchHelper.buildSearch(relationReq, {
      relation: relation,
    });

    // fetch relation data
    const result = await relationBinding.service.getMany(relationReq);
    return Array.isArray(result) ? result : result.data;
  }

  /**
   * Extract constraint values for a relation from multiple root entities
   *
   * @param roots - Root entities to extract values from
   * @param relationBinding - The relation configuration
   * @param rootKey - Root entity primary key field name
   * @returns Array of constraint values (deduplicated for owner relationships)
   */
  private extractConstraintValues(
    roots: Root[],
    relationBinding: CrudRelationBindingInterface<Root, Relations[number]>,
    rootKey: string,
  ): unknown[] {
    const relation = relationBinding.relation;

    if (relation.owner) {
      // owner (inverse) relationship: extract foreign keys from roots
      const foreignKeys = roots
        .map((root) => root[relation.foreignKey])
        .filter((fk) => fk != null);

      // deduplicate foreign keys for owner relationships
      return [...new Set(foreignKeys)];
    } else {
      // forward relationship: extract root IDs
      return roots.map((root) => root[rootKey]);
    }
  }

  /**
   * Hydrate relations on root entities by setting relation results using QueryRelation.property
   *
   * @param rootKey - Root entity primary key field name for lookups
   * @param roots - Root entities to hydrate
   * @param relations - Relation configurations defining relationships
   * @param relationArrays - Pre-fetched relation data arrays (parallel to relations)
   */
  private hydrateRelations(
    rootKey: string,
    roots: Root[],
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
    relationArrays: Relations[number][][],
  ): void {
    // create a map for quick root lookups
    const rootMap = new Map<string, Root>();
    for (const root of roots) {
      rootMap.set(root[rootKey], root);
    }

    // process each relation configuration and its corresponding relation array
    for (let index = 0; index < relationArrays.length; index++) {
      const relationArray = relationArrays[index];
      const relationBinding = relations[index];
      const relation = relationBinding.relation;

      if (relation.owner) {
        this.hydrateOwnerRelations(roots, relation, relationArray);
      } else {
        this.hydrateForwardRelations(rootMap, relation, relationArray);
      }

      // initialize empty relations for roots that have no relations
      this.initializeEmptyRelationProperties(roots, relation);
    }
  }

  /**
   * Hydrate owner (inverse) relationships: root[foreignKey] -\> relation[primaryKey]
   */
  private hydrateOwnerRelations(
    roots: Root[],
    relation: QueryRelation<Root, Relations[number]>,
    relationArray: Relations[number][],
  ): void {
    // create map of relations by their primary key
    const relationsById = new Map<string, Relations[number]>();
    for (const relationEntity of relationArray) {
      relationsById.set(relationEntity[relation.primaryKey], relationEntity);
    }

    // assign relations to roots based on root's foreign key
    for (const root of roots) {
      const foreignKeyValue = root[relation.foreignKey];
      if (foreignKeyValue != null) {
        const relationEntity = relationsById.get(foreignKeyValue);
        if (relationEntity) {
          this.assignRelationToRoot(root, relation, relationEntity);
        }
      }
    }
  }

  /**
   * Hydrate forward relationships: relation[foreignKey] -\> root[primaryKey]
   */
  private hydrateForwardRelations(
    rootMap: Map<string, Root>,
    relation: QueryRelation<Root, Relations[number]>,
    relationArray: Relations[number][],
  ): void {
    // group relation entities by their foreign key (which points to root)
    const relationsByRootKey = new Map<string, Relations[number][]>();
    for (const relationEntity of relationArray) {
      const rootKeyValue = relationEntity[relation.foreignKey];
      const existingRelations = relationsByRootKey.get(rootKeyValue);
      if (existingRelations) {
        existingRelations.push(relationEntity);
      } else {
        relationsByRootKey.set(rootKeyValue, [relationEntity]);
      }
    }

    // set relation entities on their root entities using the relation property
    for (const [rootKeyValue, relationEntities] of relationsByRootKey) {
      const root = rootMap.get(rootKeyValue);
      if (root) {
        this.assignRelationsToRoot(root, relation, relationEntities);
      }
    }
  }

  /**
   * Assign a single relation entity to a root (for owner relationships)
   */
  private assignRelationToRoot(
    root: Root,
    relation: QueryRelation<Root, Relations[number]>,
    relationEntity: Relations[number],
  ): void {
    if (relation.cardinality === CRUD_RELATION_CARDINALITY_ONE) {
      Object.assign(root, { [relation.property]: relationEntity });
    } else {
      // for one-to-many root-owned relationships (less common)
      Object.assign(root, { [relation.property]: [relationEntity] });
    }
  }

  /**
   * Assign multiple relation entities to a root (for forward relationships)
   */
  private assignRelationsToRoot(
    root: Root,
    relation: QueryRelation<Root, Relations[number]>,
    relationEntities: Relations[number][],
  ): void {
    if (relation.cardinality === CRUD_RELATION_CARDINALITY_ONE) {
      // for one-to-one, set the single relation entity
      Object.assign(root, {
        [relation.property]: relationEntities[0] || null,
      });
    } else {
      // for one-to-many, set the array of relation entities
      Object.assign(root, { [relation.property]: relationEntities });
    }
  }

  /**
   * Initialize empty relations for roots that have no relations
   */
  private initializeEmptyRelationProperties(
    roots: Root[],
    relation: QueryRelation<Root, Relations[number]>,
  ): void {
    for (const root of roots) {
      if (!(relation.property in root)) {
        this.initializeRelationProperty(root, relation);
      }
    }
  }

  /** Initialize a single relation property on a root entity */
  private initializeRelationProperty(
    root: Root,
    relation: QueryRelation<Root, Relations[number]>,
  ): void {
    if (relation.cardinality === CRUD_RELATION_CARDINALITY_ONE) {
      Object.assign(root, { [relation.property]: null });
    } else {
      Object.assign(root, { [relation.property]: [] });
    }
  }

  /** Initialize empty relation properties on roots when no relations exist */
  private initializeEmptyRelations(
    roots: Root[],
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): void {
    // flatten nested loops: iterate through all root-relation combinations
    for (const relationBinding of relations) {
      const relation = relationBinding.relation;
      for (const root of roots) {
        this.initializeRelationProperty(root, relation);
      }
    }
  }

  /** Type guard to safely extract root key from request options */
  private getRootKey(req: CrudRequestInterface<Root>): string {
    const relations = req.options?.query?.relations;
    if (!relations) {
      throw new CrudFederationException({
        message:
          'Relations configuration is required but not found in request options',
      });
    }

    const key = relations.rootKey;
    if (!key || typeof key !== 'string') {
      throw new CrudFederationException({
        message:
          'Root key must be specified in relations.rootKey as a non-empty string',
      });
    }

    return key;
  }

  /**
   * Analyze sort requirements to determine optimal getMany strategy
   *
   * Supports multi-field sorting with proper precedence:
   * - If any relation sorts exist: use RELATION_SORT strategy (relation-first)
   * - Otherwise: use ROOT_SORT strategy (normal LEFT JOIN)
   * - Relation sorts are always applied first, then root sorts as secondary criteria
   */
  private analyzeSortRequirements(
    req: CrudRequestInterface<Root>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): SortAnalysis<Root, Relations> {
    const allSorts = req.parsed.sort || [];

    if (allSorts.length === CRUD_FEDERATION_INITIAL_TOTAL) {
      return {
        type: SortStrategyType.ROOT_SORT,
        relationSorts: [],
        rootSorts: [],
      };
    }

    const relationSorts: SortConfiguration<Root, Relations>[] = [];
    const rootSorts: SortConfiguration<Root, Relations>[] = [];

    // process each sort field and categorize as relation or root sort
    for (const sortConfig of allSorts) {
      const sortField = sortConfig.field;
      const sortOrder = sortConfig.order;

      // check if sort field belongs to a relation relationship
      const drivingRelation = this.findRelationForSortField(
        sortConfig,
        relations,
      );

      if (drivingRelation) {
        // validate relation sort requirements based on cardinality
        this.validateRelationSortRequirements(req, sortField, drivingRelation);

        relationSorts.push({
          field: sortField,
          order: sortOrder,
          isRelationSort: true,
          drivingRelation,
        });
      } else {
        rootSorts.push({
          field: sortField,
          order: sortOrder,
          isRelationSort: false,
        });
      }
    }

    // determine strategy type: relation sorts take precedence
    const type =
      relationSorts.length > CRUD_FEDERATION_INITIAL_TOTAL
        ? SortStrategyType.RELATION_SORT
        : SortStrategyType.ROOT_SORT;

    return {
      type,
      relationSorts,
      rootSorts,
    };
  }

  /** Find which relation relationship owns the sort field using QuerySort.relation */
  private findRelationForSortField(
    sortConfig: QuerySort<Root>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): CrudRelationBindingInterface<Root, Relations[number]> | null {
    // use the relation property from QuerySort if available
    if (sortConfig.relation) {
      return (
        relations.find(
          (relationBinding) =>
            relationBinding.relation.property === sortConfig.relation,
        ) || null
      );
    }

    // no relation specified, assume it belongs to root
    return null;
  }

  /** Filter sorts to keep only those that belong to the root entity (no relation property) */

  /** Helper: Create and configure a relation request */
  private createRelationRequest(
    effectiveLimit?: number,
    page?: number,
  ): CrudRequestInterface<Relations[number]> {
    const relationReq = this.relationQueryHelper.createRequest();

    // set pagination parameters in a single pass
    const parsed = relationReq.parsed;
    if (effectiveLimit !== undefined) parsed.limit = effectiveLimit;
    if (page !== undefined) parsed.page = page;

    return relationReq;
  }

  /** Helper: Create relation request with filters and sorts applied */
  private createFilteredRelationRequest(options: {
    filters: QueryFilter<Root>[];
    orFilters: QueryFilter<Root>[];
    relationProperty: string;
    limit?: number;
    page?: number;
    sorts?: SortConfiguration<Root, Relations>[];
    drivingRelation?: CrudRelationBindingInterface<Root, Relations[number]>;
  }): CrudRequestInterface<Relations[number]> {
    const {
      filters,
      orFilters,
      relationProperty,
      limit,
      page,
      sorts,
      drivingRelation,
    } = options;
    const relationReq = this.createRelationRequest(limit, page);

    // apply relation sorts if provided
    if (sorts && sorts.length > CRUD_FEDERATION_INITIAL_TOTAL) {
      relationReq.parsed.sort = sorts.map((sort) => ({
        field: sort.field,
        order: sort.order,
      }));
    }

    // apply relation filters and OR filters
    this.applyRelationFiltersToRequest(
      relationReq,
      filters,
      orFilters,
      relationProperty,
      drivingRelation,
    );

    return relationReq;
  }

  /** Helper: Create relation result data with consistent structure */
  private createRelationResult(
    relationBinding: CrudRelationBindingInterface<Root, Relations[number]>,
    relationData: Relations[number][],
    relationTotal: number,
    includeRootIds: boolean = false,
  ): RelationResultData<Root, Relations> {
    const result: RelationResultData<Root, Relations> = {
      config: relationBinding,
      data: relationData,
      total: relationTotal,
    };

    // extract root IDs if requested and for forward relationships only
    if (includeRootIds && !relationBinding.relation.owner) {
      const foreignKeyField = relationBinding.relation.foreignKey;
      const allRootIds = relationData.map(
        (relationEntity) => relationEntity[foreignKeyField],
      );
      result.rootIds = this.deduplicatePreservingOrder(allRootIds);
    }

    return result;
  }

  /** Handle case when no relations are configured */
  private async handleNoRelationsCase(
    rootReq: CrudRequestInterface<Root>,
  ): Promise<{
    roots: Root[];
    total: number;
    fetchCalls: number;
    totalFetched: number;
  }> {
    // build search conditions from parsed request
    this.rootSearchHelper.buildSearch(rootReq);

    const rootResult = await this.rootService.getMany(rootReq);

    return {
      roots: rootResult.data,
      total: rootResult.total || rootResult.count,
      fetchCalls: 1,
      totalFetched: rootResult.data.length,
    };
  }

  /** Handle LEFT JOIN case - root-first strategy */
  private async handleLeftJoinCase(
    rootReq: CrudRequestInterface<Root>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
    rootKey: string,
  ): Promise<{
    roots: Root[];
    total: number;
    fetchCalls: number;
    totalFetched: number;
    relationResults: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total?: number;
    }>;
  }> {
    // first fetch roots, then relations with root ID constraints
    // build search conditions from parsed request
    this.rootSearchHelper.buildSearch(rootReq);

    const rootResult = await this.rootService.getMany(rootReq);
    const fetchedRoots = rootResult.data;

    let fetchCalls = 1;
    let totalFetched = fetchedRoots.length;
    let relationResults: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total?: number;
    }> = [];

    // now fetch relations with root ID constraints
    if (fetchedRoots.length > 0) {
      const relationEnrichment = await this.fetchRelationsForRoots({
        req: rootReq,
        relations,
        roots: fetchedRoots,
        rootKey,
      });

      fetchCalls += relationEnrichment.fetchCalls;
      totalFetched += relationEnrichment.totalFetched;
      relationResults = relationEnrichment.allRelationResults;
    }

    return {
      roots: fetchedRoots,
      total: rootResult.total || rootResult.count,
      fetchCalls,
      totalFetched,
      relationResults,
    };
  }

  /** Build final response with pagination metadata and optional metrics */
  private buildFinalResponse(
    resultRoots: Root[],
    accurateTotal: number,
    rootReq: CrudRequestInterface<Root>,
    includeMetrics: boolean,
    metrics: {
      totalFetched: number;
      fetchCalls: number;
      duration: number;
    },
  ): CrudResponsePaginatedInterface<Root> {
    const result: CrudResponsePaginatedInterface<Root> = {
      data: resultRoots,
      count: resultRoots.length,
      total: accurateTotal,
      limit: rootReq.parsed.limit || CRUD_FEDERATION_DEFAULT_LIMIT,
      page: rootReq.parsed.page || CRUD_FEDERATION_DEFAULT_PAGE,
      pageCount: rootReq.parsed.limit
        ? Math.ceil(accurateTotal / rootReq.parsed.limit)
        : Math.ceil(accurateTotal / CRUD_FEDERATION_DEFAULT_LIMIT),
      metrics: includeMetrics
        ? {
            totalFetched: metrics.totalFetched,
            totalValid: resultRoots.length,
            fetchCalls: metrics.fetchCalls,
            duration: metrics.duration,
          }
        : undefined,
    };

    return result;
  }

  /**
   * Apply INNER JOIN constraints to root query and return ordered results
   *
   * Handles the common pattern of:
   * 1. Apply CondOperator.IN constraint filter with root IDs
   * 2. Build search conditions and execute query
   * 3. Reorder results to match constraint order
   *
   * @param rootReq - Root request to constrain
   * @param rootKey - Root entity primary key field name
   * @param constraintIds - Root IDs to constrain query to
   * @returns Ordered roots matching constraint IDs with fetch metrics
   */
  private async applyInnerJoinConstraints(
    rootReq: CrudRequestInterface<Root>,
    rootKey: string,
    constraintIds: unknown[],
  ): Promise<{
    roots: Root[];
    total: number;
    fetchCalls: number;
    totalFetched: number;
  }> {
    const constrainedReq = {
      ...rootReq,
      parsed: {
        ...rootReq.parsed,
        page: 1,
        limit: constraintIds.length,
        offset: undefined,
      },
    };

    // Apply INNER JOIN constraint
    this.addConstraintFilter(constrainedReq, rootKey, constraintIds);

    // build search conditions
    this.rootSearchHelper.buildSearch(constrainedReq);

    const rootResult = await this.rootService.getMany(constrainedReq);
    const fetchedRoots = rootResult.data;

    // re-order roots to match constraint order
    const orderedRoots = this.reorderRootsByIds(
      fetchedRoots,
      constraintIds,
      rootKey,
    );

    return {
      roots: orderedRoots,
      total: rootResult.total || rootResult.count,
      fetchCalls: 1,
      totalFetched: fetchedRoots.length,
    };
  }

  /** Helper: Apply relation filters and OR filters for a specific relation property to a relation request */
  private applyRelationFiltersToRequest(
    relationReq: CrudRequestInterface<Relations[number]>,
    allFilters: QueryFilter<Root>[],
    allOrFilters: QueryFilter<Root>[],
    relationProperty: string,
    drivingRelation?: CrudRelationBindingInterface<Root, Relations[number]>,
  ): void {
    // transform and add regular filters first
    for (const filter of allFilters) {
      if (filter.relation === relationProperty) {
        const relationFilter: QueryFilter<Relations[number]> = {
          ...filter,
        };
        relationReq.parsed.filter.push(relationFilter);
      }
    }

    // apply distinctFilter after user filters if this is the driving relation for sorting
    if (drivingRelation?.relation.distinctFilter) {
      this.applyDistinctFilter(
        relationReq,
        drivingRelation.relation.distinctFilter,
      );
    }

    // transform and add OR filters
    for (const filter of allOrFilters) {
      if (filter.relation === relationProperty) {
        const relationFilter: QueryFilter<Relations[number]> = {
          ...filter,
        };
        relationReq.parsed.or.push(relationFilter);
      }
    }
  }

  /**
   * Relation-sort strategy: Handles sorting by relation fields
   *
   * Process:
   * 1. Fetch driving relation with sort + distinctFilter for uniqueness
   * 2. Extract sorted root IDs from relation results
   * 3. Fetch other relations for constraint validation
   * 4. Fetch roots constrained to sorted IDs (INNER JOIN semantics)
   * 5. Optionally enrich driving relation data if distinctFilter was used
   *
   * @param req - Root request with relation sorts
   * @param relations - All relation bindings
   * @param sortAnalysis - Analysis of sort requirements
   * @param rootKey - Root entity primary key field name
   * @returns Sorted roots with all relation data and accurate totals
   */
  private async fetchWithRelationSort(
    req: CrudRequestInterface<Root>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
    sortAnalysis: SortAnalysis<Root, Relations>,
    rootKey: string,
  ): Promise<RelationSortResult<Root, Relations>> {
    let fetchCalls = CRUD_FEDERATION_INITIAL_FETCH_COUNT;
    let totalFetched = CRUD_FEDERATION_INITIAL_TOTAL;

    // Get the primary driving relation (first relation sort)
    const primaryRelationSort = sortAnalysis.relationSorts[0];
    if (!primaryRelationSort || !primaryRelationSort.drivingRelation) {
      throw new CrudFederationException({
        message:
          'Relation sort analysis missing driving relation or sort field',
      });
    }

    const { drivingRelation } = primaryRelationSort;

    // 1. Direct pagination with distinctFilter (no iteration needed)
    const relationLimit = req.parsed.limit || CRUD_FEDERATION_DEFAULT_LIMIT;
    const relationPage = req.parsed.page || CRUD_FEDERATION_DEFAULT_PAGE;

    // Apply relation filters for this specific relationship
    const allFilters = req.parsed.filter || [];
    const allOrFilters = req.parsed.or || [];

    // 2. Single efficient relation query with direct pagination and all relation sorts
    const sortingRelationReq = this.createFilteredRelationRequest({
      filters: allFilters,
      orFilters: allOrFilters,
      relationProperty: drivingRelation.relation.property,
      limit: relationLimit,
      page: relationPage,
      sorts: sortAnalysis.relationSorts,
      drivingRelation: drivingRelation, // Pass driving relation to apply distinctFilter
    });

    // build search conditions
    this.relationSearchHelper.buildSearch(sortingRelationReq, {
      relation: drivingRelation.relation,
    });

    // Single relation fetch (guaranteed unique by distinctFilter)
    const relationResult = await drivingRelation.service.getMany(
      sortingRelationReq,
    );

    const allSortingRelationData = relationResult.data;
    const sortingRelationTotal = relationResult.total;
    fetchCalls += 1;
    totalFetched += allSortingRelationData.length;

    // 3. Extract root IDs from relation data (guaranteed unique by distinctFilter)
    let sortedRootIds: unknown[] = [];

    if (allSortingRelationData.length === 0) {
      return {
        sortedRoots: [],
        allRelationResults: [],
        accurateTotal: 0,
        fetchCalls,
        totalFetched,
      };
    }

    // Extract root IDs in sort order from the driving relation
    if (drivingRelation.relation.owner) {
      // Inverse relationship: extract primary keys from relations as root IDs
      const primaryKeyField = drivingRelation.relation.primaryKey;
      sortedRootIds = allSortingRelationData
        .map((relationEntity) => relationEntity[primaryKeyField])
        .filter((id) => id !== null && id !== undefined);
    } else {
      // forward relationship: extract root IDs (distinctFilter ensures uniqueness)
      const foreignKeyField = drivingRelation.relation.foreignKey;
      sortedRootIds = allSortingRelationData
        .map((relationEntity) => relationEntity[foreignKeyField])
        .filter((rootId) => rootId !== null && rootId !== undefined);
    }

    // Phase 2: Fetch other relations for constraint checking
    const otherRelations = relations.filter(
      (relationBinding) => relationBinding !== drivingRelation,
    );

    const otherRelationResults = await this.fetchOtherRelationsForConstraint(
      otherRelations,
      allFilters,
      allOrFilters,
    );

    fetchCalls += otherRelationResults.fetchCalls;
    totalFetched += otherRelationResults.totalFetched;

    // Phase 3: Fetch roots in sorted order with INNER JOIN constraint
    let sortedRoots: Root[] = [];

    // INNER JOIN: Only fetch roots that exist in the sorted relation results
    if (sortedRootIds.length > 0) {
      // Copy request and overwrite search conditions for INNER JOIN
      const rootReq = {
        ...req,
        parsed: {
          ...req.parsed,
          sort: sortAnalysis.rootSorts.map((sort) => ({
            field: sort.field,
            order: sort.order,
          })),
        },
      };

      // Apply INNER JOIN constraints and get ordered results
      const constrainedResult = await this.applyInnerJoinConstraints(
        rootReq,
        rootKey,
        sortedRootIds,
      );
      sortedRoots = constrainedResult.roots;
      fetchCalls += constrainedResult.fetchCalls;
      totalFetched += constrainedResult.totalFetched;
    }

    // Additional enrichment fetch for driving relation when distinctFilter is used
    let enrichmentRelationData = allSortingRelationData;
    let enrichmentRelationTotal = sortingRelationTotal;
    if (
      drivingRelation.relation.distinctFilter &&
      drivingRelation.relation.cardinality === CRUD_RELATION_CARDINALITY_MANY
    ) {
      // Use existing helper method to fetch all relations for discovered root IDs
      const enrichmentResult = await this.fetchRelationsForRoots({
        req,
        relations: [drivingRelation], // only fetch for the driving relation
        roots: sortedRoots,
        rootKey: this.getRootKey(req),
      });

      // Find the enrichment data for the driving relation
      const drivingRelationResult = enrichmentResult.allRelationResults.find(
        (result) => result.config === drivingRelation,
      );

      if (drivingRelationResult) {
        enrichmentRelationData = drivingRelationResult.data;
        enrichmentRelationTotal =
          drivingRelationResult.total || sortingRelationTotal;
        fetchCalls += enrichmentResult.fetchCalls;
        totalFetched += enrichmentResult.totalFetched;
      }
    }

    // Combine all relation results
    const allRelationResults = [
      {
        config: drivingRelation,
        data: enrichmentRelationData, // Use enrichment data (all relations) instead of sorting data
        total: enrichmentRelationTotal, // Use enrichment total (includes all relations, not just unique ones)
      },
      ...otherRelationResults.results,
    ];

    return {
      sortedRoots,
      allRelationResults,
      accurateTotal: sortingRelationTotal, // Use relation total as it represents count of unique matching roots
      fetchCalls,
      totalFetched,
    };
  }

  /** Phase 1: Fetch all relations for enrichment */
  private async fetchAllRelationsForEnrichment(options: {
    req: CrudRequestInterface<Root>;
    relations: CrudRelationBindingInterface<Root, Relations[number]>[];
  }): Promise<RelationEnrichmentResult<Root, Relations>> {
    const { req, relations } = options;
    let fetchCalls = CRUD_FEDERATION_INITIAL_FETCH_COUNT;
    let totalFetched = CRUD_FEDERATION_INITIAL_TOTAL;

    // Collect all relation results for reuse
    const allRelationResults: RelationResultData<Root, Relations>[] = [];

    // Separate filters into root and relation filters
    const allFilters = req.parsed.filter || [];
    const allOrFilters = req.parsed.or || [];

    // Query each relation relationship for enrichment data
    for (const relationBinding of relations) {
      const relationReq = this.createFilteredRelationRequest({
        filters: allFilters,
        orFilters: allOrFilters,
        relationProperty: relationBinding.relation.property,
      });

      // build search conditions before calling service
      this.relationSearchHelper.buildSearch(relationReq, {
        relation: relationBinding.relation,
      });

      const relationQueryResult = await relationBinding.service.getMany(
        relationReq,
      );
      const relationData = relationQueryResult.data;
      const relationTotal = relationQueryResult.total;

      fetchCalls += 1;
      totalFetched += relationData.length;

      // Store this relation result for reuse
      const relationResult = this.createRelationResult(
        relationBinding,
        relationData,
        relationTotal,
        true, // Include root IDs for enrichment
      );
      allRelationResults.push(relationResult);
    }

    return {
      allRelationResults,
      fetchCalls,
      totalFetched,
    };
  }

  /** Helper: Fetch other relations for constraint checking in RELATION_SORT */
  private async fetchOtherRelationsForConstraint(
    otherRelations: CrudRelationBindingInterface<Root, Relations[number]>[],
    allFilters: QueryFilter<Root>[],
    allOrFilters: QueryFilter<Root>[],
  ): Promise<{
    results: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total: number;
    }>;
    fetchCalls: number;
    totalFetched: number;
  }> {
    const otherRelationResults: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total: number;
    }> = [];
    let fetchCalls = CRUD_FEDERATION_INITIAL_FETCH_COUNT;
    let totalFetched = CRUD_FEDERATION_INITIAL_TOTAL;

    for (const relationBinding of otherRelations) {
      const relationReq = this.createFilteredRelationRequest({
        filters: allFilters,
        orFilters: allOrFilters,
        relationProperty: relationBinding.relation.property,
      });

      // build search conditions before calling service
      this.relationSearchHelper.buildSearch(relationReq, {
        relation: relationBinding.relation,
      });

      const relationResult = await relationBinding.service.getMany(relationReq);
      const relationData = relationResult.data;
      const relationTotal = relationResult.total;

      fetchCalls += 1;
      totalFetched += relationData.length;

      // Continue even if relation has no results - supports both LEFT and INNER JOIN semantics
      // For LEFT JOIN: roots returned regardless; for INNER JOIN: constrains discovered root IDs
      otherRelationResults.push(
        this.createRelationResult(relationBinding, relationData, relationTotal),
      );
    }

    return {
      results: otherRelationResults,
      fetchCalls,
      totalFetched,
    };
  }

  /** Fetch relations for given root entities */
  private async fetchRelationsForRoots(options: {
    req: CrudRequestInterface<Root>;
    relations: CrudRelationBindingInterface<Root, Relations[number]>[];
    roots: Root[];
    rootKey: string;
  }): Promise<{
    allRelationResults: Array<{
      config: CrudRelationBindingInterface<Root, Relations[number]>;
      data: Relations[number][];
      total?: number;
    }>;
    fetchCalls: number;
    totalFetched: number;
  }> {
    const { req, relations, roots, rootKey } = options;

    // extract root IDs from the provided roots
    const rootIds = roots.map((root) => root[rootKey]);

    if (
      relations.length === CRUD_FEDERATION_INITIAL_TOTAL ||
      rootIds.length === CRUD_FEDERATION_INITIAL_TOTAL
    ) {
      return {
        allRelationResults: [],
        fetchCalls: CRUD_FEDERATION_INITIAL_FETCH_COUNT,
        totalFetched: CRUD_FEDERATION_INITIAL_TOTAL,
      };
    }

    // Separate filters into root and relation filters
    const allFilters = req.parsed.filter || [];
    const allOrFilters = req.parsed.or || [];

    // Extract relation filters (with relation property) for this method
    const relationFilters: QueryFilter<Root>[] = allFilters.filter(
      (filter) => filter.relation,
    );
    const relationOrFilters: QueryFilter<Root>[] = allOrFilters.filter(
      (filter) => filter.relation,
    );

    const relationPromises = relations.map(
      async (
        relationBinding: CrudRelationBindingInterface<Root, Relations[number]>,
      ) => {
        // Extract constraint values based on relationship direction
        const constraintValues = this.extractConstraintValues(
          roots,
          relationBinding,
          rootKey,
        );

        // Use the helper method to fetch relations with constraints
        return this.fetchRelationsWithConstraints(
          relationBinding,
          constraintValues,
          relationFilters,
          relationOrFilters,
        );
      },
    );

    const relationArrays = await Promise.all(relationPromises);
    const totalFetched = relationArrays.reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    // Convert to the expected result structure
    const allRelationResults = relations.map((config, index) =>
      this.createRelationResult(
        config,
        relationArrays[index],
        relationArrays[index].length,
      ),
    );

    return {
      allRelationResults,
      fetchCalls: relationPromises.length,
      totalFetched,
    };
  }

  /** Helper: Check if INNER JOIN should be applied - any relation filters imply INNER JOIN semantics */
  private shouldApplyInnerJoin(
    req: CrudRequestInterface<Root>,
    relations: CrudRelationBindingInterface<Root, Relations[number]>[],
  ): boolean {
    const allFilters = req.parsed.filter || [];
    const allOrFilters = req.parsed.or || [];

    // Any filters on relation relationships imply INNER JOIN semantics
    // (constraint validation has already been performed at a higher level)
    for (const filter of [...allFilters, ...allOrFilters]) {
      if (filter.relation) {
        const hasMatchingRelation = relations.some(
          (relationBinding) =>
            relationBinding.relation.property === filter.relation,
        );
        if (hasMatchingRelation) {
          return true;
        }
      }
    }

    return false;
  }

  /** Helper: Check if there's a CondOperator.NOT_NULL AND filter on the join key for the driving relation relationship */
  private hasNotnullFilterOnJoinKey(
    req: CrudRequestInterface<Root>,
    drivingRelation: CrudRelationBindingInterface<Root, Relations[number]>,
  ): boolean {
    const allFilters = req.parsed.filter || [];

    // Determine the join key based on relationship direction
    const joinKey = drivingRelation.relation.owner
      ? drivingRelation.relation.primaryKey
      : drivingRelation.relation.foreignKey;

    // Check for CondOperator.NOT_NULL AND filter on the join key within this relationship
    // Only CondOperator.NOT_NULL ensures we get ALL entities with relationships for proper sorting
    // Other operators like CondOperator.GREATER_THAN, CondOperator.EQUALS may exclude valid relationships
    for (const filter of allFilters) {
      if (
        filter.relation === drivingRelation.relation.property &&
        filter.field === joinKey &&
        filter.operator === CondOperator.NOT_NULL
      ) {
        return true;
      }
    }

    return false;
  }

  /** Validate relation sort requirements based on cardinality and configuration */
  private validateRelationSortRequirements(
    req: CrudRequestInterface<Root>,
    sortField: string,
    drivingRelation: CrudRelationBindingInterface<Root, Relations[number]>,
  ): void {
    const relation = drivingRelation.relation;

    // One-to-one relationships are always supported (no additional requirements)
    if (relation.cardinality === CRUD_RELATION_CARDINALITY_ONE) {
      return;
    }

    // Many relationships require distinctFilter
    if (
      relation.cardinality === CRUD_RELATION_CARDINALITY_MANY &&
      !relation.distinctFilter
    ) {
      throw new CrudFederationException({
        message:
          "Sorting by relation field '%s' on many-cardinality relationship '%s' requires a distinctFilter configuration. " +
          "Add distinctFilter: { fieldName: { [CondOperator.EQUALS]: 'value' } } to the relation configuration to ensure at most one relation row per root entity for consistent sorting.",
        messageParams: [sortField, relation.property],
      });
    }

    // For safety (Option B), still require CondOperator.NOT_NULL filter for INNER JOIN semantics
    const hasJoinKeyFilter = this.hasNotnullFilterOnJoinKey(
      req,
      drivingRelation,
    );
    if (!hasJoinKeyFilter) {
      const joinKey = relation.owner
        ? relation.primaryKey
        : relation.foreignKey;
      throw new CrudFederationException({
        message:
          "Sorting by '%s' requires a CondOperator.NOT_NULL filter on the join key to ensure consistent results. " +
          "Add the filter '%s.%s||$notnull' to enable relation property sorting. " +
          'Only CondOperator.NOT_NULL guarantees all entities with relationships are included for proper sorting.',
        messageParams: [sortField, relation.property, joinKey],
      });
    }
  }

  /** Apply distinctFilter to ensure uniqueness for many-cardinality relation sorting */
  private applyDistinctFilter(
    relationReq: CrudRequestInterface<Relations[number]>,
    distinctFilter: QueryFilter<Relations[number]>,
  ): void {
    // Simply add the distinctFilter to the relation request filters
    relationReq.parsed.filter.push(distinctFilter);
  }
}

// Internal interfaces and types

/** Sort strategy types for different getMany approaches */
enum SortStrategyType {
  ROOT_SORT = 'ROOT_SORT',
  RELATION_SORT = 'RELATION_SORT',
}

/** Individual sort configuration with its target (relation vs root) */
interface SortConfiguration<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  field: string;
  order: QuerySortOperator;
  isRelationSort: boolean;
  drivingRelation?: CrudRelationBindingInterface<Root, Relations[number]>;
}

/** Analysis result for sort requirements */
interface SortAnalysis<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  type: SortStrategyType;
  relationSorts: SortConfiguration<Root, Relations>[];
  rootSorts: SortConfiguration<Root, Relations>[];
}

/** Interface for relation result data with consistent structure */
interface RelationResultData<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  config: CrudRelationBindingInterface<Root, Relations[number]>;
  data: Relations[number][];
  rootIds?: unknown[]; // Optional - not needed for all use cases
  total: number;
}

/** Interface for relation enrichment result from fetchAllRelationsForEnrichment */
interface RelationEnrichmentResult<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  allRelationResults: RelationResultData<Root, Relations>[];
  fetchCalls: number;
  totalFetched: number;
}

/** Interface for relation sort result from fetchWithRelationSort */
interface RelationSortResult<
  Root extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  sortedRoots: Root[];
  allRelationResults: RelationResultData<Root, Relations>[];
  accurateTotal: number;
  fetchCalls: number;
  totalFetched: number;
}
