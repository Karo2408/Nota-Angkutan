/* =========================================================
   NOTA ANGKUTAN - APP LOGIC
   Tidak menggunakan database/backend. Semua data disimpan
   sementara di memory (array rows[]) selama sesi browser.
========================================================= */

(function () {
  "use strict";

  // ---------- STATE ----------
  let rows = []; // { id, jenis, jumlah, volume, keterangan }
  let rowIdCounter = 0;

  const rowsContainer = document.getElementById("rowsContainer");
  const outTbody = document.getElementById("out-tbody");
  const form = document.getElementById("notaForm");
  const formError = document.getElementById("formError");

  // ---------- HELPERS ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function formatTanggalIndo(dateStr) {
    if (!dateStr) return "";
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  }

  function todayIndo() {
    const d = new Date();
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  }

  function setText(pageNode, selector, value) {
    const node = pageNode.querySelector(selector);
    if (node) node.textContent = value && String(value).trim() !== "" ? value : "";
  }

  // ---------- PREVIEW RENDER ----------
  function getFormValues() {
    const data = {};
    Array.from(form.elements).forEach((elm) => {
      if (elm.name) data[elm.name] = elm.value;
    });
    return data;
  }

  function renderPreview() {
    const data = getFormValues();
    const container = document.getElementById("pagesContainer");
    const template = document.getElementById("pageTemplate");
    container.innerHTML = ""; // Clear existing

    // Calculate totals for the entire document
    let totalJumlah = 0;
    let totalVolume = 0;
    let jumlahIsAllNumeric = true;
    let volumeIsAllNumeric = true;

    rows.forEach(row => {
      const jNum = parseFloat((row.jumlah || "").replace(",", "."));
      const vNum = parseFloat((row.volume || "").replace(",", "."));
      if (!isNaN(jNum)) totalJumlah += jNum; else if (row.jumlah) jumlahIsAllNumeric = false;
      if (!isNaN(vNum)) totalVolume += vNum; else if (row.volume) volumeIsAllNumeric = false;
    });

    const totalJumlahStr = jumlahIsAllNumeric && totalJumlah > 0 ? formatNumber(totalJumlah) : "";
    const totalVolumeStr = volumeIsAllNumeric && totalVolume > 0 ? formatNumber(totalVolume) : "";

    const ROWS_PAGE_1 = 6;
    const ROWS_PAGE_N = 18;

    let remainingRows = [...rows];
    // Ensure at least 1 row to not break table visually
    if (remainingRows.length === 0) {
      remainingRows = [{ jenis: "", jumlah: "", volume: "", keterangan: "" }];
    }

    let pageNum = 1;
    let rowStartIdx = 0;

    while (remainingRows.length > 0 || pageNum === 1) {
      const isPage1 = (pageNum === 1);
      const limit = isPage1 ? ROWS_PAGE_1 : ROWS_PAGE_N;
      
      const pageRows = remainingRows.splice(0, limit);
      const isLastPage = (remainingRows.length === 0);

      // Clone template
      const pageFrag = template.content.cloneNode(true);
      const pageNode = pageFrag.querySelector(".doc-sheet");

      // Common headers
      setText(pageNode, ".out-nomor", data.nomor);

      // Top info (Asal, Tujuan) - only on Page 1
      const topInfo = pageNode.querySelector(".doc-top-info");
      if (isPage1) {
        setText(pageNode, ".out-desa", data.desa);
        setText(pageNode, ".out-kabupaten", data.kabupaten);
        setText(pageNode, ".out-kecamatan", data.kecamatan);
        setText(pageNode, ".out-provinsi", data.provinsi);
        setText(pageNode, ".out-buktiKepemilikan", data.buktiKepemilikan);
        setText(pageNode, ".out-noBuktiKepemilikan", data.noBuktiKepemilikan);
        setText(pageNode, ".out-pengirim", data.pengirim);
        setText(pageNode, ".out-alamatPengirim1", data.alamatPengirim1);
        setText(pageNode, ".out-alamatPengirim2", data.alamatPengirim2);
        setText(pageNode, ".out-tempatMuat", data.tempatMuat);
        setText(pageNode, ".out-jenisIdentitas", data.jenisIdentitas);
        setText(pageNode, ".out-alatAngkut", data.alatAngkut);
        setText(pageNode, ".out-noPol", data.noPol);
        
        setText(pageNode, ".out-namaPenerima", data.namaPenerima);
        setText(pageNode, ".out-alamatPenerima1", data.alamatPenerima1);
        setText(pageNode, ".out-alamatPenerima2", data.alamatPenerima2);
        
        setText(pageNode, ".out-selama", data.selama);
        setText(pageNode, ".out-dariTanggal", formatTanggalIndo(data.dariTanggal));
        setText(pageNode, ".out-sampaiTanggal", formatTanggalIndo(data.sampaiTanggal));
      } else {
        topInfo.style.display = "none";
      }

      // Populate table rows
      const tbody = pageNode.querySelector(".out-tbody");
      pageRows.forEach((row, idx) => {
        const tr = document.createElement("tr");
        tr.appendChild(el("td", "col-nomor", String(rowStartIdx + idx + 1)));
        tr.appendChild(el("td", "col-jenis", row.jenis));
        tr.appendChild(el("td", "col-jumlah", row.jumlah));
        tr.appendChild(el("td", "col-volume", row.volume));
        tr.appendChild(el("td", "col-ket", row.keterangan));
        tbody.appendChild(tr);
      });
      rowStartIdx += pageRows.length;

      // Bottom info (Catatan, Tanda Tangan, Totals)
      const bottomInfo = pageNode.querySelector(".doc-bottom-info");
      const tfoot = pageNode.querySelector(".out-tfoot");

      if (isLastPage) {
        setText(pageNode, ".out-totalJumlah", totalJumlahStr);
        setText(pageNode, ".out-totalVolume", totalVolumeStr);
        
        const kota = (data.kotaTtd || "").trim();
        const tglLine = (kota ? kota + ", " : "") + todayIndo();
        setText(pageNode, ".out-tglTtd", tglLine);
        setText(pageNode, ".out-namaPemilik", data.namaPemilik || "Endi Suhendi");
        
        // Catatan
        const catatanNode = pageNode.querySelector(".out-catatan");
        if (catatanNode) {
          catatanNode.textContent = (data.catatan || "").trim();
          catatanNode.style.display = (data.catatan || "").trim() ? "block" : "none";
        }
      } else {
        // If not last page, hide totals and bottom signature section
        tfoot.style.display = "none";
        bottomInfo.style.display = "none";
      }

      container.appendChild(pageNode);
      if (isLastPage) break;
      pageNum++;
    }
  }

  function formatNumber(n) {
    // Buang trailing .00 jika bulat
    return Number.isInteger(n) ? String(n) : String(n.toFixed(2));
  }

  // ---------- VALIDASI ----------
  function validateForm() {
    const requiredIds = [
      "nomor", "desa", "kabupaten", "kecamatan", "provinsi",
      "pengirim", "namaPenerima", "namaPemilik"
    ];
    const missing = [];
    requiredIds.forEach((id) => {
      const node = document.getElementById(id);
      if (node && !node.value.trim()) {
        missing.push(node.previousElementSibling ? node.previousElementSibling.textContent : id);
      }
    });

    const hasRowContent = rows.some(r => r.jenis.trim() || r.jumlah.trim() || r.volume.trim());
    if (!hasRowContent) {
      missing.push("Minimal 1 baris Rincian Hasil Hutan harus diisi");
    }

    return missing;
  }

  // ---------- MODAL, PREVIEW, & ZOOM ----------
  const previewModal = document.getElementById("previewModal");
  const pagesContainer = document.getElementById("pagesContainer");
  const modalPreviewScroll = document.getElementById("modalPreviewScroll");
  const zoomLevelLabel = document.getElementById("zoomLevel");
  let currentZoom = 1;

  function updateZoom() {
    pagesContainer.style.transform = `scale(${currentZoom})`;
    zoomLevelLabel.textContent = Math.round(currentZoom * 100) + "%";
  }

  function handleZoomIn() {
    if (currentZoom < 2.0) {
      currentZoom = Math.min(2.0, currentZoom + 0.1);
      updateZoom();
    }
  }

  function handleZoomOut() {
    if (currentZoom > 0.3) {
      currentZoom = Math.max(0.3, currentZoom - 0.1);
      updateZoom();
    }
  }

  // --- Pinch / Wheel Zoom Events ---
  let initialDistance = null;
  let initialZoom = 1;

  modalPreviewScroll.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent standard browser pinch zoom
      initialDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialZoom = currentZoom;
    }
  }, { passive: false });

  modalPreviewScroll.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && initialDistance) {
      e.preventDefault();
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomFactor = currentDistance / initialDistance;
      let newZoom = initialZoom * zoomFactor;
      
      if (newZoom > 2.0) newZoom = 2.0;
      if (newZoom < 0.2) newZoom = 0.2;
      
      currentZoom = newZoom;
      updateZoom();
    }
  }, { passive: false });

  modalPreviewScroll.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      initialDistance = null;
    }
  });

  modalPreviewScroll.addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        currentZoom = Math.min(2.0, currentZoom + 0.05);
      } else {
        currentZoom = Math.max(0.2, currentZoom - 0.05);
      }
      updateZoom();
    }
  }, { passive: false });

  function openModal() {
    formError.textContent = "";
    const missing = validateForm();
    if (missing.length > 0) {
      formError.textContent = "Mohon lengkapi: " + missing.join(", ");
      formError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    
    // Auto-scale to fit window on open
    const padding = 48; // modal padding
    const maxDocWidth = 794;
    const availableWidth = window.innerWidth - padding;
    
    if (availableWidth < maxDocWidth) {
      currentZoom = availableWidth / maxDocWidth;
    } else {
      currentZoom = 1;
    }

    renderPreview();
    updateZoom();
    previewModal.classList.add("active");
  }

  function closeModal() {
    previewModal.classList.remove("active");
  }

  document.getElementById("previewBtn").addEventListener("click", openModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelDownloadBtn").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  
  document.getElementById("zoomInBtn").addEventListener("click", handleZoomIn);
  document.getElementById("zoomOutBtn").addEventListener("click", handleZoomOut);
  
  document.getElementById("confirmDownloadBtn").addEventListener("click", downloadPDF);

  // ---------- ROW MANAGEMENT (TABEL ISI) ----------
  function addRow(initial) {
    const row = Object.assign({
      id: ++rowIdCounter,
      jenis: "",
      jumlah: "",
      volume: "",
      keterangan: ""
    }, initial || {});
    rows.push(row);
    renderRowEditor();
    renderPreview();
  }

  function removeCheckedRows() {
    const checked = Array.from(document.querySelectorAll(".row-check-input:checked"))
      .map(cb => Number(cb.dataset.id));
    if (checked.length === 0) {
      if (rows.length > 1) rows.pop();
    } else {
      rows = rows.filter(r => !checked.includes(r.id));
      if (rows.length === 0) rows.push({ id: ++rowIdCounter, jenis: "", jumlah: "", volume: "", keterangan: "" });
    }
    renderRowEditor();
    renderPreview();
  }

  function renderRowEditor() {
    rowsContainer.innerHTML = "";
    rows.forEach((row, index) => {
      const item = el("div", "row-item");
      item.dataset.id = row.id;

      const headerWrap = el("div", "row-item-header");
      const title = el("div", "row-item-title", `Baris ${index + 1}`);
      const checkWrap = el("div", "row-check");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "row-check-input";
      check.dataset.id = row.id;
      check.title = "Pilih untuk dihapus";
      checkWrap.appendChild(check);
      const deleteLabel = el("label", "row-delete-label", "Hapus");
      checkWrap.appendChild(deleteLabel);
      headerWrap.appendChild(title);
      headerWrap.appendChild(checkWrap);

      const jenisWrap = makeRowField(row, "jenis", "text", "Jenis Hasil Hutan", "field-full");
      const jumlahWrap = makeRowField(row, "jumlah", "text", "Jumlah (Batang/Ikat)", "field-half");
      const volumeWrap = makeRowField(row, "volume", "text", "Volume (SM)", "field-half");
      const ketWrap = makeRowField(row, "keterangan", "text", "Keterangan", "field-full");

      item.appendChild(headerWrap);
      item.appendChild(jenisWrap);
      item.appendChild(jumlahWrap);
      item.appendChild(volumeWrap);
      item.appendChild(ketWrap);

      rowsContainer.appendChild(item);
    });
  }

  function makeRowField(row, field, type, labelText, extraClass) {
    const wrap = el("div", `row-field ${extraClass}`);
    const label = el("label", "", labelText);
    const input = document.createElement("input");
    input.type = type;
    input.value = row[field];
    input.placeholder = `Masukkan ${labelText.toLowerCase()}`;
    input.addEventListener("input", (e) => {
      row[field] = e.target.value;
      renderPreview();
    });
    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  // ---------- DOWNLOAD PDF ----------
  async function downloadPDF() {
    const btn = document.getElementById("confirmDownloadBtn");
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Memproses PDF...";
    
    const cancelBtn = document.getElementById("cancelDownloadBtn");
    cancelBtn.disabled = true;

    // Temporarily disable transform to fix html2canvas rendering bug
    const oldTransform = pagesContainer.style.transform;
    pagesContainer.style.transform = "none";

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const pages = document.querySelectorAll("#pagesContainer .doc-sheet");
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        // Kloning node untuk menghindari bug rendering CSS Transform & Modal
        const clone = pages[i].cloneNode(true);
        
        // Posisikan clone di luar layar dengan style mentah
        Object.assign(clone.style, {
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          transform: "none",
          margin: "0",
          boxShadow: "none"
        });
        document.body.appendChild(clone);
        
        const canvas = await html2canvas(clone, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false
        });

        // Hapus clone setelah selesai
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL("image/png");
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      const nomorNota = (document.getElementById("nomor").value || "nota").replace(/[\\/:*?"<>|]/g, "-");
      pdf.save(`Nota-Angkutan-${nomorNota}.pdf`);
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    } finally {
      // Restore transform
      pagesContainer.style.transform = oldTransform;
      
      btn.disabled = false;
      btn.textContent = originalLabel;
      cancelBtn.disabled = false;
    }
  }

  // ---------- RESET ----------
  function resetAll() {
    setTimeout(() => {
      rows = [];
      rowIdCounter = 0;
      addRow();
      addRow();
      addRow();
      renderPreview();
      formError.textContent = "";
    }, 0);
  }

  // ---------- EVENTS ----------
  document.getElementById("addRowBtn").addEventListener("click", () => addRow());
  document.getElementById("removeRowBtn").addEventListener("click", removeCheckedRows);
  form.addEventListener("reset", resetAll);
  form.addEventListener("input", renderPreview);

  // ---------- INIT ----------
  addRow();
  addRow();
  addRow();
  renderPreview();

})();
