import { useMemo, useState } from "react";
import {
  createStudentDrive,
  createStudentDriveFolder,
  createStudentDriveNote,
  getStudentDrive,
  uploadStudentDriveFile,
} from "../utils/api";
import { formatSize } from "../utils/helpers";
import Loader from "./Loader";

const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 50);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const prettyDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const fileEmoji = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📕";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "🖼️";
  if (["doc", "docx", "txt"].includes(ext)) return "📝";
  if (["ppt", "pptx"].includes(ext)) return "📊";
  if (["xls", "xlsx"].includes(ext)) return "📈";
  return "📎";
};

function EmptyState({ driveName, joinId, setDriveName, setJoinId, onCreateDrive, onJoinDrive, loading }) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 shadow-sm p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-gray-900 mb-2" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
            Student Drive
          </h1>
          <p className="text-gray-600 text-sm">A shared classroom workspace for folders, documents, and text notes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-extrabold text-xl text-gray-900 mb-1" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
              Create New Drive
            </h2>
            <p className="text-sm text-gray-500 mb-4">Generate a drive ID and share it with classmates.</p>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Drive Name</label>
            <input
              value={driveName}
              onChange={(event) => setDriveName(event.target.value)}
              placeholder="e.g. DBMS Semester Notes"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
            />

            <button
              onClick={onCreateDrive}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Drive"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-extrabold text-xl text-gray-900 mb-1" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
              Join Existing Drive
            </h2>
            <p className="text-sm text-gray-500 mb-4">Enter a Drive ID and continue where your team left off.</p>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Drive ID</label>
            <input
              value={joinId}
              onChange={(event) => setJoinId(event.target.value.toUpperCase())}
              maxLength={8}
              placeholder="Enter Drive ID"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold tracking-widest text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
              style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
            />

            <button
              onClick={onJoinDrive}
              disabled={loading || !joinId.trim()}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Opening..." : "Enter Drive"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ folders, totalFiles, totalNotes }) {
  return (
    <aside className="bg-slate-50 border-b md:border-b-0 md:border-r border-gray-200 p-4">
      <button className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 text-left shadow-sm">
        + New
      </button>

      <div className="mt-4 grid grid-cols-3 md:grid-cols-1 gap-1">
        <div className="rounded-lg bg-cyan-100 text-cyan-900 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 text-center md:text-left">Home</div>
        <div className="rounded-lg text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-2 text-center md:text-left">My Drive</div>
        <div className="rounded-lg text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-2 text-center md:text-left">Shared</div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4 grid grid-cols-3 md:grid-cols-1 gap-2 md:space-y-2">
        <div className="rounded-lg bg-white border border-gray-200 px-2 py-2 md:p-0 md:bg-transparent md:border-0">
          <div className="text-[11px] text-gray-500">Folders</div>
          <div className="text-sm font-semibold text-gray-800">{folders}</div>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 px-2 py-2 md:p-0 md:bg-transparent md:border-0">
          <div className="text-[11px] text-gray-500">Documents</div>
          <div className="text-sm font-semibold text-gray-800">{totalFiles}</div>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 px-2 py-2 md:p-0 md:bg-transparent md:border-0">
          <div className="text-[11px] text-gray-500">Text Notes</div>
          <div className="text-sm font-semibold text-gray-800">{totalNotes}</div>
        </div>
      </div>
    </aside>
  );
}

function FolderCard({ folder, draft, setNoteDrafts, onUpload, onAddNote, loading }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-extrabold text-lg text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
          {folder.name}
        </h3>
        <span className="text-xs text-gray-500">
          {(folder.files?.length || 0)} files, {(folder.notes?.length || 0)} notes
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 cursor-pointer transition-all">
          Add Documents
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              onUpload(folder.id, event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <span className="text-[11px] text-gray-500">Max {MAX_UPLOAD_MB}MB per file</span>
      </div>

      <div className="space-y-2 mb-3">
        <input
          value={draft.title}
          onChange={(event) =>
            setNoteDrafts((prev) => ({
              ...prev,
              [folder.id]: { ...draft, title: event.target.value },
            }))
          }
          placeholder="Note title"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
        <textarea
          value={draft.content}
          onChange={(event) =>
            setNoteDrafts((prev) => ({
              ...prev,
              [folder.id]: { ...draft, content: event.target.value },
            }))
          }
          rows={3}
          placeholder="Write your note"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-y focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
        <button
          onClick={() => onAddNote(folder.id)}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 disabled:opacity-50"
        >
          Save Note
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {(folder.files || []).slice(0, 4).map((file) => (
          <a
            key={file.id}
            href={file.viewUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100 transition-all"
          >
            <span className="mr-2">{fileEmoji(file.name)}</span>
            <span className="font-medium text-gray-800">{file.name}</span>
            <span className="text-xs text-gray-500 ml-2">{formatSize(file.size || 0)}</span>
          </a>
        ))}
        {(folder.files || []).length === 0 && <p className="text-xs text-gray-500">No files yet.</p>}
      </div>
    </div>
  );
}

export default function StudentDriveDashboard({ toast }) {
  const [drive, setDrive] = useState(null);
  const [driveName, setDriveName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const totalFiles = useMemo(
    () => (drive?.folders || []).reduce((sum, folder) => sum + (folder.files?.length || 0), 0),
    [drive]
  );

  const totalNotes = useMemo(
    () => (drive?.folders || []).reduce((sum, folder) => sum + (folder.notes?.length || 0), 0),
    [drive]
  );

  const allFiles = useMemo(() => {
    if (!drive) return [];

    return drive.folders.flatMap((folder) =>
      (folder.files || []).map((file) => ({
        ...file,
        folderName: folder.name,
      }))
    );
  }, [drive]);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allFiles;

    return allFiles.filter(
      (file) => file.name?.toLowerCase().includes(term) || file.folderName?.toLowerCase().includes(term)
    );
  }, [allFiles, search]);

  const loadDrive = async (driveId) => {
    const data = await getStudentDrive((driveId || "").trim().toUpperCase());
    setDrive(data);
    return data;
  };

  const handleCreateDrive = async () => {
    try {
      setLoading(true);
      const createdDrive = await createStudentDrive({ name: driveName.trim() });
      setDrive(createdDrive);
      setJoinId(createdDrive.driveId);
      toast(`Drive created: ${createdDrive.driveId}`, "success");
    } catch (error) {
      toast(error.message || "Unable to create drive", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDrive = async () => {
    try {
      setLoading(true);
      const openedDrive = await loadDrive(joinId);
      toast(`Entered drive ${openedDrive.driveId}`, "success");
    } catch (error) {
      toast(error.message || "Unable to open drive", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!drive || !newFolderName.trim()) return;

    try {
      setLoading(true);
      const updatedDrive = await createStudentDriveFolder({
        driveId: drive.driveId,
        name: newFolderName.trim(),
      });
      setDrive(updatedDrive);
      setNewFolderName("");
      toast("Folder created", "success");
    } catch (error) {
      toast(error.message || "Unable to create folder", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFolderFiles = async (folderId, fileList) => {
    if (!drive || !fileList?.length) return;

    const selectedFiles = Array.from(fileList);
    const acceptedFiles = selectedFiles.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const rejectedCount = selectedFiles.length - acceptedFiles.length;

    if (rejectedCount > 0) {
      toast(`${rejectedCount} file${rejectedCount !== 1 ? "s" : ""} skipped. Max size is ${MAX_UPLOAD_MB}MB.`, "error");
    }

    if (!acceptedFiles.length) return;

    try {
      setLoading(true);
      let updatedDrive = drive;

      for (let index = 0; index < acceptedFiles.length; index += 1) {
        // Upload sequentially so failures are easier to recover from.
        // eslint-disable-next-line no-await-in-loop
        updatedDrive = await uploadStudentDriveFile({
          driveId: drive.driveId,
          folderId,
          file: acceptedFiles[index],
        });
      }

      setDrive(updatedDrive);
      toast(`${acceptedFiles.length} file${acceptedFiles.length !== 1 ? "s" : ""} uploaded`, "success");
    } catch (error) {
      toast(error.message || "Unable to upload file", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (folderId) => {
    if (!drive) return;

    const draft = noteDrafts[folderId] || { title: "", content: "" };
    const title = draft.title?.trim() || "";
    const content = draft.content?.trim() || "";

    if (!title || !content) {
      toast("Add note title and content", "error");
      return;
    }

    try {
      setLoading(true);
      const updatedDrive = await createStudentDriveNote({
        driveId: drive.driveId,
        folderId,
        title,
        content,
      });
      setDrive(updatedDrive);
      setNoteDrafts((prev) => ({ ...prev, [folderId]: { title: "", content: "" } }));
      toast("Note added", "success");
    } catch (error) {
      toast(error.message || "Unable to add note", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDriveId = async () => {
    if (!drive?.driveId) return;

    try {
      await navigator.clipboard.writeText(drive.driveId);
      toast("Drive ID copied", "success");
    } catch {
      toast("Unable to copy Drive ID", "error");
    }
  };

  if (!drive) {
    return (
      <EmptyState
        driveName={driveName}
        joinId={joinId}
        setDriveName={setDriveName}
        setJoinId={setJoinId}
        onCreateDrive={handleCreateDrive}
        onJoinDrive={handleJoinDrive}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-0 md:min-h-[720px]">
          <Sidebar folders={drive.folders.length} totalFiles={totalFiles} totalNotes={totalNotes} />

          <main className="bg-white">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="w-full max-w-2xl">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search in Drive"
                  className="w-full px-4 py-2.5 rounded-full border border-gray-300 bg-slate-100/70 text-sm text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="flex items-center flex-wrap gap-2 justify-start lg:justify-end">
                <div className="px-2.5 sm:px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-[11px] sm:text-xs font-bold tracking-widest text-cyan-900" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
                  {drive.driveId}
                </div>
                <button
                  onClick={handleCopyDriveId}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-cyan-800 bg-cyan-100 hover:bg-cyan-200"
                >
                  Copy ID
                </button>
                <button
                  onClick={() => setDrive(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Leave Drive
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-5 space-y-6">
              <section>
                <h1 className="font-extrabold text-2xl sm:text-3xl text-gray-900 break-words" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
                  Welcome to {drive.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Build folders, upload documents, and add text notes. File limit: {MAX_UPLOAD_MB}MB each.
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <h2 className="font-semibold text-gray-800 mb-3">Create Folder</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    placeholder="Folder name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-md disabled:opacity-50"
                  >
                    Add Folder
                  </button>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-gray-800 mb-3">Suggested folders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {drive.folders.slice(0, 6).map((folder) => {
                    const draft = noteDrafts[folder.id] || { title: "", content: "" };
                    return (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        draft={draft}
                        setNoteDrafts={setNoteDrafts}
                        onUpload={handleUploadFolderFiles}
                        onAddNote={handleAddNote}
                        loading={loading}
                      />
                    );
                  })}
                </div>
                {drive.folders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm text-gray-500 text-center">
                    No folders yet. Create one to start uploading documents and adding notes.
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-semibold text-gray-800 mb-3">Documents</h2>
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1.7fr_1fr_0.9fr_0.9fr_0.8fr] bg-slate-50 px-4 py-2 text-xs font-semibold text-gray-600">
                    <div>Name</div>
                    <div>Folder</div>
                    <div>Type</div>
                    <div>Size</div>
                    <div>Added</div>
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-500 text-center">No documents match your search.</div>
                  ) : (
                    <div className="max-h-[360px] overflow-auto">
                      <div className="md:hidden divide-y divide-gray-100">
                        {filteredFiles.map((file) => (
                          <a
                            key={file.id}
                            href={file.viewUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-3 py-3 hover:bg-slate-50"
                          >
                            <div className="font-medium text-gray-800 truncate">
                              <span className="mr-2">{fileEmoji(file.name)}</span>
                              {file.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                              <span>Folder: {file.folderName}</span>
                              <span>Type: {(file.mimeType || "file").split("/").pop()?.toUpperCase()}</span>
                              <span>Size: {formatSize(file.size || 0)}</span>
                              <span>Added: {prettyDate(file.uploadedAt)}</span>
                            </div>
                          </a>
                        ))}
                      </div>

                      <div className="hidden md:block">
                        {filteredFiles.map((file) => (
                          <a
                            key={file.id}
                            href={file.viewUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid grid-cols-[1.7fr_1fr_0.9fr_0.9fr_0.8fr] px-4 py-3 border-t border-gray-100 text-sm hover:bg-slate-50"
                          >
                            <div className="font-medium text-gray-800 truncate">
                              <span className="mr-2">{fileEmoji(file.name)}</span>
                              {file.name}
                            </div>
                            <div className="text-gray-600 truncate">{file.folderName}</div>
                            <div className="text-gray-600 uppercase text-xs">{(file.mimeType || "file").split("/").pop()}</div>
                            <div className="text-gray-600">{formatSize(file.size || 0)}</div>
                            <div className="text-gray-500">{prettyDate(file.uploadedAt)}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {loading && (
              <div className="border-t border-gray-200">
                <Loader text="Saving to drive..." />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
