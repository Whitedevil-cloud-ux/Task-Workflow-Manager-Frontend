import api from "../services/api";

export default function TestBackend() {

  const testAPI = async () => {
    try {
      const res = await api.get("/");
      console.log(res.data);
      alert("Backend is connected!");
    } catch (err) {
      alert("Backend connection failed");
      console.log(err);
    }
  };

  return (
    <div className="p-10">
      <button
        onClick={testAPI}
        className="bg-blue-600 text-white px-4 py-2"
      >
        Test Backend
      </button>
    </div>
  );
}
