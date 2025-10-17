document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("gallery");
  const searchInput = document.getElementById("search");

  fetch("images.json")
    .then(res => res.json())
    .then(data => {
      displayImages(data);

      searchInput.addEventListener("input", e => {
        const value = e.target.value.toLowerCase();
        const filtered = data.filter(img => img.name.toLowerCase().includes(value));
        displayImages(filtered);
      });
    })
    .catch(err => console.error("Error loading images.json:", err));

  function displayImages(images) {
    gallery.innerHTML = "";
    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `
        <a href="../images/${img.file}" data-lg-size="1406-1390">
          <img src="../images/${img.file}" alt="${img.name}">
        </a>
        <button class="download-btn" onclick="downloadImage('../images/${img.file}')">تحميل</button>
      `;
      gallery.appendChild(card);
    });

    lightGallery(gallery, {
      selector: "a",
      zoom: true,
      download: false,
      backgroundColor: 'rgba(255, 215, 0, 0.1)'
    });
  }
});

function downloadImage(url) {
  const link = document.createElement("a");
  link.href = url;
  link.download = url.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
