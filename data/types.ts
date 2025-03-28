export interface PreferredPositions {
    defender: number;
    midfielder: number;
    attacker: number;
  }
  
  export interface UserProfile {
    UserId: string;
    FirstName: string;
    LastName: string;
    PreferredPositions: string[];
    CreatedAt?: string;
    UpdatedAt?: string;
  }
  
  // Game types
  export interface Player {
    id: string;
    name: string;
    position: string;
  }

  export interface Game {
    id: string;
    date: string;
    time: string;
    location: string;
    playersCount: number;
    status: 'upcoming' | 'completed';
    players: Player[];
    result?: string;
  }
  
  // Cognito/Amplify Auth types
  export interface CognitoUser {
    username: string;
    attributes?: {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  // Auth context types
  export interface AuthContextType {
    user: CognitoUser | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
  }
  
  // Component props types
  export interface NavLinkProps {
    href: string;
    active: boolean;
    children: React.ReactNode;
  }
  
  export interface ProfileFormProps {
    initialData?: Partial<Omit<UserProfile, 'userId'>>;
  }
  
  // DynamoDB response types
  export interface DynamoDBResponse {
    $metadata: {
      httpStatusCode: number;
      requestId: string;
      extendedRequestId?: string;
      cfId?: string;
      attempts: number;
      totalRetryDelay: number;
    };
    [key: string]: any;
  }