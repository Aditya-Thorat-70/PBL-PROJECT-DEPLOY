import { useEffect, useMemo, useRef, useState } from "react";
import {
  createStudentDriveAccount,
  createStudentDriveFolder,
  deleteStudentDriveFile,
  getStudentDriveMe,
  loginStudentDrive,
  uploadStudentDriveFile,
} from "../utils/api";
import { formatSize } from "../utils/helpers";
import Loader from "./Loader";

const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 50);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const STUDENT_DRIVE_TOKEN_KEY = "studentDriveToken";

const prettyDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const fileEmoji = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "IMG";
  if (["doc", "docx", "txt"].includes(ext)) return "DOC";
  if (["ppt", "pptx"].includes(ext)) return "PPT";
  if (["xls", "xlsx"].includes(ext)) return "XLS";
  return "FILE";
};

function AuthScreen({
  registerName,
  registerUsername,
  registerPassword,
  loginUsername,
  loginPassword,
  setRegisterName,
  setRegisterUsername,
  setRegisterPassword,
  setLoginUsername,
  setLoginPassword,
  onCreate,
  onLogin,
  loading,
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 shadow-sm p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-gray-900 mb-2">Student Drive</h1>
          <p className="text-gray-600 text-sm">Create and access your drive with username and password.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-extrabold text-xl text-gray-900 mb-1">Create Account + Drive</h2>
            <p className="text-sm text-gray-500 mb-4">Your credentials will be used to access this drive.</p>

            <div className="space-y-3">
              <input
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Drive name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <input
                value={registerUsername}
                onChange={(event) => setRegisterUsername(event.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Password (min 6 chars)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              onClick={onCreate}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-extrabold text-xl text-gray-900 mb-1">Login</h2>
            <p className="text-sm text-gray-500 mb-4">Access your Student Drive with credentials.</p>

            <div className="space-y-3">
              <input
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              onClick={onLogin}
              disabled={loading || !loginUsername.trim() || !loginPassword.trim()}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Opening..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderTree({ items, activeFolderId, onOpen }) {
  if (!items.length) {
    return <p className="text-xs text-gray-500">No folders yet.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onOpen(folder.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
            activeFolderId === folder.id
              ? "bg-cyan-100 text-cyan-900 font-semibold"
              : "text-gray-700 hover:bg-slate-100"
          }`}
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-cyan-100 text-cyan-700 text-[10px] font-bold mr-2">D</span>
          {folder.name}
        </button>
      ))}
    </div>
  );
}

function UploadDropZone({ disabled, onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all shadow-sm ${
        disabled
          ? "border-gray-200 bg-gray-50"
          : dragging
            ? "border-cyan-500 bg-cyan-50"
            : "border-cyan-200 bg-white hover:bg-cyan-50/40 hover:border-cyan-300"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) {
          onUpload(event.dataTransfer.files);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          onUpload(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-cyan-100 text-cyan-700 text-lg font-bold flex items-center justify-center">UP</div>
      <p className="text-sm font-semibold text-gray-800">Drag and drop files here</p>
      <p className="text-xs text-gray-500 mt-1">or click browse to upload inside this folder</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-cyan-800 bg-cyan-100 hover:bg-cyan-200 disabled:opacity-50"
      >
        Browse Files
      </button>
      <p className="text-[11px] text-gray-500 mt-2">Max {MAX_UPLOAD_MB}MB per file</p>
    </div>
  );
}

export default function StudentDriveDashboard({ toast }) {
  const [drive, setDrive] = useState(null);
  const [token, setToken] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [navTab, setNavTab] = useState("drive");
  const [loading, setLoading] = useState(false);
  const createFolderInputRef = useRef(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = window.localStorage.getItem(STUDENT_DRIVE_TOKEN_KEY);
      if (!storedToken) return;

      try {
        setLoading(true);
        const restoredDrive = await getStudentDriveMe(storedToken);
        setDrive(restoredDrive);
        setToken(storedToken);
      } catch {
        window.localStorage.removeItem(STUDENT_DRIVE_TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const folderMap = useMemo(() => {
    const map = new Map();
    (drive?.folders || []).forEach((folder) => {
      map.set(folder.id, folder);
    });
    return map;
  }, [drive]);

  const rootFolders = useMemo(
    () => (drive?.folders || []).filter((folder) => !folder.parentFolderId),
    [drive]
  );

  const currentFolder = useMemo(
    () => (currentFolderId ? folderMap.get(currentFolderId) || null : null),
    [folderMap, currentFolderId]
  );

  const childFolders = useMemo(
    () => (drive?.folders || []).filter((folder) => String(folder.parentFolderId || "") === String(currentFolderId || "")),
    [drive, currentFolderId]
  );

  const currentFiles = useMemo(() => {
    if (!currentFolder) return [];
    return currentFolder.files || [];
  }, [currentFolder]);

  const breadcrumb = useMemo(() => {
    const chain = [];
    let cursor = currentFolder;
    const guard = new Set();

    while (cursor && !guard.has(cursor.id)) {
      chain.unshift(cursor);
      guard.add(cursor.id);
      cursor = cursor.parentFolderId ? folderMap.get(String(cursor.parentFolderId)) : null;
    }

    return chain;
  }, [currentFolder, folderMap]);

  const totalFiles = useMemo(
    () => (drive?.folders || []).reduce((sum, folder) => sum + (folder.files?.length || 0), 0),
    [drive]
  );

  const recentFiles = useMemo(() => {
    if (!drive) return [];

    return (drive.folders || [])
      .flatMap((folder) =>
        (folder.files || []).map((file) => ({
          ...file,
          folderName: folder.name,
        }))
      )
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [drive]);

  const isRecentView = navTab === "recent";

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      const response = await createStudentDriveAccount({
        name: registerName.trim(),
        username: registerUsername.trim(),
        password: registerPassword,
      });

      setDrive(response.drive);
      setToken(response.token);
      window.localStorage.setItem(STUDENT_DRIVE_TOKEN_KEY, response.token);
      setCurrentFolderId(null);
      setLoginUsername("");
      setLoginPassword("");
      toast("Student Drive account created", "success");
    } catch (error) {
      toast(error.message || "Unable to create account", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await loginStudentDrive({
        username: loginUsername.trim(),
        password: loginPassword,
      });

      setDrive(response.drive);
      setToken(response.token);
      window.localStorage.setItem(STUDENT_DRIVE_TOKEN_KEY, response.token);
      setCurrentFolderId(null);
      toast("Logged in successfully", "success");
    } catch (error) {
      toast(error.message || "Unable to login", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!drive || !newFolderName.trim() || !token) return;

    try {
      setLoading(true);
      const updatedDrive = await createStudentDriveFolder({
        token,
        driveId: drive.driveId,
        name: newFolderName.trim(),
        parentFolderId: currentFolderId || null,
      });
      setDrive(updatedDrive);
      setNewFolderName("");
      toast(currentFolderId ? "Subfolder created" : "Folder created", "success");
    } catch (error) {
      toast(error.message || "Unable to create folder", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadInCurrentFolder = async (fileList) => {
    if (!drive || !currentFolderId || !fileList?.length || !token) {
      if (!currentFolderId) {
        toast("Open a folder first to upload documents", "error");
      }
      return;
    }

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
        // Upload sequentially so partial failures can recover cleanly.
        // eslint-disable-next-line no-await-in-loop
        updatedDrive = await uploadStudentDriveFile({
          token,
          driveId: drive.driveId,
          folderId: currentFolderId,
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

  const handleDeleteFile = async (fileId) => {
    if (!drive || !token || !currentFolderId || !fileId) return;

    const shouldDelete = window.confirm("Delete this document permanently?");
    if (!shouldDelete) return;

    try {
      setLoading(true);
      const updatedDrive = await deleteStudentDriveFile({
        token,
        driveId: drive.driveId,
        folderId: currentFolderId,
        fileId,
      });
      setDrive(updatedDrive);
      toast("Document deleted", "success");
    } catch (error) {
      toast(error.message || "Unable to delete document", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(STUDENT_DRIVE_TOKEN_KEY);
    setDrive(null);
    setToken("");
    setCurrentFolderId(null);
    setRegisterPassword("");
    setLoginPassword("");
    toast("Logged out", "info");
  };

  const handleNewClick = () => {
    setNavTab("drive");
    window.setTimeout(() => {
      createFolderInputRef.current?.focus?.();
    }, 0);
  };

  if (!drive) {
    return (
      <AuthScreen
        registerName={registerName}
        registerUsername={registerUsername}
        registerPassword={registerPassword}
        loginUsername={loginUsername}
        loginPassword={loginPassword}
        setRegisterName={setRegisterName}
        setRegisterUsername={setRegisterUsername}
        setRegisterPassword={setRegisterPassword}
        setLoginUsername={setLoginUsername}
        setLoginPassword={setLoginPassword}
        onCreate={handleCreateAccount}
        onLogin={handleLogin}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-3 sm:py-5">
      <div className="rounded-3xl border border-gray-200 bg-[#f8fafc] shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-0 lg:min-h-[780px]">
          <aside className="bg-[#f1f5f9] border-b lg:border-b-0 lg:border-r border-gray-200 p-4">
            <button
              onClick={handleNewClick}
              className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm text-left"
            >
              + New
            </button>

            <nav className="mt-4 space-y-1 text-sm">
              <button
                onClick={() => {
                  setNavTab("drive");
                  setCurrentFolderId(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl ${navTab === "drive" ? "bg-cyan-100 text-cyan-900 font-semibold" : "text-gray-700 hover:bg-white"}`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setNavTab("drive");
                  setCurrentFolderId(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl ${navTab === "drive" ? "bg-cyan-100 text-cyan-900 font-semibold" : "text-gray-700 hover:bg-white"}`}
              >
                My Drive
              </button>
              <button
                onClick={() => setNavTab("recent")}
                className={`w-full text-left px-3 py-2 rounded-xl ${navTab === "recent" ? "bg-cyan-100 text-cyan-900 font-semibold" : "text-gray-700 hover:bg-white"}`}
              >
                Recent
              </button>
            </nav>

            <div className="mt-5 rounded-xl bg-white border border-gray-200 px-3 py-3 text-xs space-y-2">
              <div className="flex items-center justify-between"><span className="text-gray-500">Username</span><span className="font-semibold text-gray-800">{drive.username || "-"}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Folders</span><span className="font-semibold text-gray-800">{drive.folders.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Documents</span><span className="font-semibold text-gray-800">{totalFiles}</span></div>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Root folders</h3>
              <FolderTree items={rootFolders} activeFolderId={currentFolderId} onOpen={setCurrentFolderId} />
            </div>
          </aside>

          <main className="bg-white">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <span>{isRecentView ? "Recent" : "My Drive"}</span>
                  {!isRecentView && (
                    <>
                      <span className="text-gray-400">›</span>
                      <span className="truncate max-w-[260px]">{drive.name}</span>
                    </>
                  )}
                  {!isRecentView && currentFolder && (
                    <>
                      <span className="text-gray-400">›</span>
                      <span className="truncate max-w-[240px]">{currentFolder.name}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-gray-300 overflow-hidden inline-flex">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1.5 text-xs font-semibold ${viewMode === "list" ? "bg-cyan-100 text-cyan-900" : "text-gray-600 bg-white"}`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1.5 text-xs font-semibold ${viewMode === "grid" ? "bg-cyan-100 text-cyan-900" : "text-gray-600 bg-white"}`}
                    >
                      Grid
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Folders: {drive.folders.length}</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Files: {totalFiles}</span>
                {isRecentView && <span className="px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800">Showing recent files</span>}
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 space-y-4">
              {!isRecentView && (
              <section className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className={`px-2.5 py-1 rounded-lg ${currentFolderId ? "bg-white text-gray-700" : "bg-cyan-100 text-cyan-800 font-semibold"}`}
                  >
                    Root
                  </button>
                  {breadcrumb.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`px-2.5 py-1 rounded-lg ${folder.id === currentFolderId ? "bg-cyan-100 text-cyan-800 font-semibold" : "bg-white text-gray-700"}`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 items-start">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      ref={createFolderInputRef}
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      placeholder={currentFolder ? "Create subfolder" : "Create new root folder"}
                      className="w-full sm:flex-1 h-11 px-4 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                    <button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || loading}
                      className="h-11 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-md disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      {currentFolder ? "Add Subfolder" : "Add Folder"}
                    </button>
                  </div>
                  <UploadDropZone disabled={!currentFolderId || loading} onUpload={handleUploadInCurrentFolder} />
                </div>
              </section>
              )}

              {viewMode === "list" ? (
              <section className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[1.8fr_0.9fr_0.9fr_0.8fr_0.6fr] bg-slate-50 px-4 py-3 text-xs font-semibold text-gray-600">
                  <div>Name</div>
                  <div>Type</div>
                  <div>Date modified</div>
                  <div>File size</div>
                  <div className="text-right">Action</div>
                </div>

                {(isRecentView ? recentFiles.length === 0 : childFolders.length === 0 && currentFiles.length === 0) ? (
                  <div className="px-4 py-10 text-sm text-gray-500 text-center">No items in this location.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {!isRecentView && childFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="w-full text-left grid grid-cols-[1.8fr_0.9fr_0.9fr_0.8fr_0.6fr] px-4 py-3 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-gray-800 truncate">
                          <span className="inline-flex items-center justify-center min-w-[42px] h-6 px-2 mr-2 rounded bg-amber-100 text-amber-700 text-[10px] font-bold align-middle">FOLDER</span>
                          {folder.name}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600">Folder</div>
                        <div className="text-xs md:text-sm text-gray-600">{prettyDate(folder.createdAt)}</div>
                        <div className="text-xs md:text-sm text-gray-400">-</div>
                        <div className="text-right text-xs text-gray-400">-</div>
                      </button>
                    ))}

                    {(isRecentView ? recentFiles : currentFiles).map((file) => (
                      <a
                        key={file.id}
                        href={file.viewUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid grid-cols-[1.8fr_0.9fr_0.9fr_0.8fr_0.6fr] px-4 py-3 text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-gray-800 truncate">
                          <span className="inline-flex items-center justify-center min-w-[42px] h-6 px-2 mr-2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold align-middle">{fileEmoji(file.name)}</span>
                          {file.name}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 uppercase">{(file.mimeType || "file").split("/").pop()}</div>
                        <div className="text-xs md:text-sm text-gray-600">{prettyDate(file.uploadedAt)}</div>
                        <div className="text-xs md:text-sm text-gray-600">{formatSize(file.size || 0)}</div>
                        <div className="text-right">
                          {!isRecentView ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                handleDeleteFile(file.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>
              ) : (
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                {(isRecentView ? recentFiles.length === 0 : childFolders.length === 0 && currentFiles.length === 0) ? (
                  <div className="px-4 py-10 text-sm text-gray-500 text-center">No items in this location.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {!isRecentView && childFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="text-left rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm hover:border-cyan-300 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">DIR</div>
                        <div className="mt-2 font-semibold text-gray-800 truncate">{folder.name}</div>
                        <div className="text-xs text-gray-500 mt-1">Folder • {prettyDate(folder.createdAt)}</div>
                      </button>
                    ))}

                    {(isRecentView ? recentFiles : currentFiles).map((file) => (
                      <div
                        key={file.id}
                        className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm hover:border-cyan-300 transition-all"
                      >
                        <a
                          href={file.viewUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">{fileEmoji(file.name)}</div>
                          <div className="mt-2 font-semibold text-gray-800 truncate">{file.name}</div>
                        </a>
                        <div className="text-xs text-gray-500 mt-1">{prettyDate(file.uploadedAt)} • {formatSize(file.size || 0)}</div>
                        {!isRecentView && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id)}
                            className="mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              )}
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
