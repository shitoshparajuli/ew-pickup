export default function HomePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Soccer Pickup</h1>
        <p className="text-xl mb-8">
          Join our Tuesday evening pickup soccer games and have fun with fellow players.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <p className="mb-4">
            This is a placeholder for the home page. In the future, this page will contain
            information about upcoming games, how to join, and other important details.
          </p>
          <p>
            Sign in with your Google account to create a player profile and get started!
          </p>
        </div>
      </div>
    </div>
  );
}