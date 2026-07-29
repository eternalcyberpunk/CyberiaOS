import tempfile
import threading
import time
import unittest
from pathlib import Path
import zipfile

from unpack_zip import ensure_safe_path, unpack, wait_for_archive


class UnpackZipTests(unittest.TestCase):
    def test_ensure_safe_path_allows_inside(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            base = Path(temp_dir)
            result = ensure_safe_path(base, "a/b/file.txt")
            self.assertTrue(str(result).startswith(str(base.resolve())))

    def test_ensure_safe_path_rejects_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            base = Path(temp_dir)
            with self.assertRaises(ValueError):
                ensure_safe_path(base, "../outside.txt")

    def test_unpack_extracts_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            archive_path = temp_path / "sample.zip"
            out_dir = temp_path / "out"

            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("root.txt", "hello")
                archive.writestr("nested/inner.txt", "world")

            unpack(archive_path, out_dir)

            self.assertEqual((out_dir / "root.txt").read_text(), "hello")
            self.assertEqual((out_dir / "nested/inner.txt").read_text(), "world")

    def test_wait_for_archive_detects_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            archive_path = Path(temp_dir) / "incoming.zip"

            def create_file() -> None:
                time.sleep(0.15)
                archive_path.write_bytes(b"x")

            writer = threading.Thread(target=create_file)
            writer.start()
            wait_for_archive(archive_path, interval_seconds=0.05, timeout_seconds=2)
            writer.join()
            self.assertTrue(archive_path.exists())

    def test_wait_for_archive_times_out(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            archive_path = Path(temp_dir) / "never.zip"
            with self.assertRaises(TimeoutError):
                wait_for_archive(archive_path, interval_seconds=0.05, timeout_seconds=0.1)


if __name__ == "__main__":
    unittest.main()
