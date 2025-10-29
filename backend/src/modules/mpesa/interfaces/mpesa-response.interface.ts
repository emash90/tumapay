/**
 * M-Pesa STK Push Response
 */
export interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * M-Pesa STK Push Callback Response
 */
export interface MpesaStkPushCallbackResponse {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

/**
 * M-Pesa B2C Response
 */
export interface MpesaB2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

/**
 * M-Pesa B2C Callback Response
 */
export interface MpesaB2CCallbackResponse {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

/**
 * M-Pesa Access Token Response
 */
export interface MpesaAccessTokenResponse {
  access_token: string;
  expires_in: string;
}

/**
 * M-Pesa Account Balance Response
 */
export interface MpesaAccountBalanceResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

/**
 * M-Pesa Transaction Status Response
 */
export interface MpesaTransactionStatusResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}
