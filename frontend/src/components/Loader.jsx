export default function Loader({ text = "Uploading..." }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-11 h-11 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-500">{text}</p>
    </div>
  );
}