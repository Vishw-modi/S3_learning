import Uploder from "./components/Uploder";

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Upload your file here
      </h1>
      <Uploder />
    </div>
  );
}
