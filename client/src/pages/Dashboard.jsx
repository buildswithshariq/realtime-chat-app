import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex items-center justify-center h-[90vh]">
        <h1 className="text-4xl font-bold">
          Welcome to Dashboard
        </h1>
      </div>
    </div>
  );
}

export default Dashboard;