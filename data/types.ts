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
  IsMember?: boolean;
}

export interface Game {
  id: string;
  date: string;
  day: string;
  time: string;
  location: string;
  playersCount?: number;
  status: 'UPCOMING' | 'COMPLETED';
  winner?: string;
  loser?: string;
  isPaid?: boolean;
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

// Types for algorithm
export type Position = 'Attacker' | 'Midfielder' | 'Defender';

export interface Player {
  uuid: string;
  name: string;
  rating: number;
  position: Position[];
}

export interface Team {
  players: Player[];
  elo: number;
}

export interface TeamStats {
  averageRating: number;
  positionCounts: Record<Position, number>;
  stdDev: number;
}