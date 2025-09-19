import { useState } from "react";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function FileUploader({ api, onUploaded, label = "Upload File", extraFields = {} }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();

      // Nếu backend nhận key = "file" (không phải "files")
      if (files.length === 1) {
        formData.append("file", files[0], files[0].name);
      } else {
        // Nếu cần hỗ trợ nhiều file (tuỳ backend)
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i], files[i].name);
        }
      }

      // Thêm các trường phụ (vd: source_name)
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const res = await fetch(api, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }

      // Callback trả kết quả
      onUploaded?.(data);

      // Thông báo theo từng API
      if (data.chunks) {
        toast.success(`✅ Uploaded! ${data.chunks} chunks created`);
      } else if (data.docs) {
        toast.success(`✅ Uploaded Idioms! ${data.docs} docs, ${data.chunks} chunks`);
      } else {
        toast.success("✅ File uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100">
      <PaperClipIcon className="h-5 w-5 text-gray-500" />
      <span className="text-sm text-gray-700">{uploading ? "Uploading..." : label}</span>
      <input
        type="file"
        className="hidden"
        multiple={false} // chỉnh về 1 file, backend PDF/idioms chỉ nhận 1
        onChange={handleFileChange}
        disabled={uploading}
      />
    </label>
  );
}
