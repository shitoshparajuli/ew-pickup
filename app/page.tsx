export default function HomePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Everest Warriors Football Club</h1>
        <p className="text-xl mb-8">
          Join our for pick-up games and let's have fun!
        </p>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">Next Game</h2>
          <p className="mb-6">
            Our next game is scheduled for Tuesday at 9:00 PM.
          </p>
          <a href="/check-in">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
              I'm Playing
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}