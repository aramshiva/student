declare module "swagger-ui-react" {
  import { ComponentType } from "react";

  interface SwaggerUIProps {
    spec?: object;
    url?: string;
    layout?: string;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    tryItOutEnabled?: boolean;
    requestInterceptor?: (request: object) => object;
    responseInterceptor?: (response: object) => object;
    onComplete?: () => void;
    persistAuthorization?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
