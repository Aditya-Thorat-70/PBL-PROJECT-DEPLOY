import { useEffect, useMemo, useRef, useState } from "react";
import {
  createStudentDriveAccount,
  createStudentDriveFolder,
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
  if (ext === "pdf") return "??";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "???";
  if (["doc", "docx", "txt"].includes(ext)) return "??";
  if (["ppt", "pptx"].includes(ext)) return "??";
  if (["xls", "xlsx"].includes(ext)) return "??";
  return "??";
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
          <span className="mr-2">??</span>
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
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
        disabled
          ? "border-gray-200 bg-gray-50"
          : dragging
            ? "border-cyan-400 bg-cyan-50"
            : "border-cyan-200 bg-white hover:bg-cyan-50/40"
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

      <div className="text-3xl mb-2">??</div>
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
  const [loading, setLoading] = useState(false);

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

  const handleLogout = () => {
    window.localStorage.removeItem(STUDENT_DRIVE_TOKEN_KEY);
    setDrive(null);
    setToken("");
    setCurrentFolderId(null);
    setRegisterPassword("");
    setLoginPassword("");
    toast("Logged out", "info");
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
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-0 md:min-h-[720px]">
          <aside className="bg-slate-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 space-y-4">
            <div className="rounded-xl bg-white border border-cyan-200 px-3 py-2 text-xs">
              <div className="text-cyan-700 font-semibold">Username</div>
              <div className="mt-0.5 font-bold text-cyan-900">{drive.username || "-"}</div>
            </div>

            <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs space-y-1">
              <div className="flex items-center justify-between"><span className="text-gray-500">Folders</span><span className="font-semibold text-gray-800">{drive.folders.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Documents</span><span className="font-semibold text-gray-800">{totalFiles}</span></div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Root folders</h3>
              <FolderTree items={rootFolders} activeFolderId={currentFolderId} onOpen={setCurrentFolderId} />
            </div>
          </aside>

          <main className="bg-white">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
              <div className="min-w-0">
                <h1 className="font-extrabold text-xl sm:text-2xl text-gray-900 truncate">{drive.name}</h1>
                <p className="text-xs text-gray-500">Nested folders with folder-specific documents.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-5 space-y-5">
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

                <h2 className="font-semibold text-gray-800 mb-2">{currentFolder ? `Open folder: ${currentFolder.name}` : "Root level"}</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    placeholder={currentFolder ? "Create subfolder" : "Create new root folder"}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:shadow-md disabled:opacity-50"
                  >
                    {currentFolder ? "Add Subfolder" : "Add Folder"}
                  </button>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-gray-800 mb-3">Folders in current location</h2>
                {childFolders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm text-gray-500 text-center">
                    No subfolders here yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {childFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="text-left rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm hover:border-cyan-300 transition-all"
                      >
                        <div className="text-lg">??</div>
                        <div className="mt-1 font-semibold text-gray-800 truncate">{folder.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(folder.files?.length || 0)} docs • {prettyDate(folder.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-semibold text-gray-800 mb-3">Upload documents to opened folder</h2>
                <UploadDropZone disabled={!currentFolderId || loading} onUpload={handleUploadInCurrentFolder} />
              </section>

              <section>
                <h2 className="font-semibold text-gray-800 mb-3">Documents in opened folder</h2>
                {!currentFolder ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm text-gray-500 text-center">
                    Open a folder to view and upload documents.
                  </div>
                ) : (currentFolder.files || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm text-gray-500 text-center">
                    This folder has no documents yet.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[1.8fr_0.9fr_0.9fr_0.8fr] bg-slate-50 px-4 py-2 text-xs font-semibold text-gray-600">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Added</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {(currentFolder.files || []).map((file) => (
                        <a
                          key={file.id}
                          href={file.viewUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block md:grid md:grid-cols-[1.8fr_0.9fr_0.9fr_0.8fr] px-4 py-3 text-sm hover:bg-slate-50"
                        >
                          <div className="font-medium text-gray-800 truncate">
                            <span className="mr-2">{fileEmoji(file.name)}</span>
                            {file.name}
                          </div>
                          <div className="mt-1 md:mt-0 text-xs md:text-sm text-gray-600 uppercase">{(file.mimeType || "file").split("/").pop()}</div>
                          <div className="mt-1 md:mt-0 text-xs md:text-sm text-gray-600">{formatSize(file.size || 0)}</div>
                          <div className="mt-1 md:mt-0 text-xs md:text-sm text-gray-500">{prettyDate(file.uploadedAt)}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
