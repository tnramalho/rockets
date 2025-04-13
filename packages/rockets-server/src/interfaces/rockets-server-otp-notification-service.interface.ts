export interface RocketsServerOtpNotificationServiceInterface {
  sendOtpEmail(params: { email: string; passcode: string }): Promise<void>;
}
