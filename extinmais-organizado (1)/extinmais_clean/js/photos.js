const ImageCompressor = {
  async compress(file, maxWidth = 600, maxHeight = 600, quality = 0.55) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedData = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedData);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
};

// ===== GERENCIADOR CENTRALIZADO DE FOTOS =====
const PhotosManager = {
  sectionStorage: {},
  generalPhotos: [],
  maxPhotosPerSection: 20,

  init() {
    const savedSection = localStorage.getItem('sectionPhotos');
    const savedGeneral = localStorage.getItem('generalPhotos');

    if (savedSection) {
      try {
        this.sectionStorage = JSON.parse(savedSection);
      } catch (e) {
        this.sectionStorage = {};
      }
    }

    if (savedGeneral) {
      try {
        this.generalPhotos = JSON.parse(savedGeneral);
      } catch (e) {
        this.generalPhotos = [];
      }
    }
  },

  async addGeneralPhoto(photoData) {
    if (this.generalPhotos.length >= this.maxPhotosPerSection) {
      showToast(`Máximo de ${this.maxPhotosPerSection} fotos gerais atingido!`, 'warning');
      return false;
    }

    this.generalPhotos.push({
      id: Date.now() + Math.random(),
      data: photoData,
      timestamp: new Date().toLocaleString('pt-BR')
    });

    try {
      this.saveGeneral();
      this.renderGeneralGallery();
      this.updateGeneralCounter();
      return true;
    } catch (error) {
      this.generalPhotos.pop();
      showToast('Erro ao salvar foto. Limite de espaço atingido!', 'error');
      return false;
    }
  },

  deleteGeneralPhoto(index) {
    if (index >= 0 && index < this.generalPhotos.length) {
      this.generalPhotos.splice(index, 1);
      this.saveGeneral();
      this.renderGeneralGallery();
      this.updateGeneralCounter();
    }
  },

  clearGeneral() {
    this.generalPhotos = [];
    this.saveGeneral();
    this.renderGeneralGallery();
    this.updateGeneralCounter();
  },

  saveGeneral() {
    localStorage.setItem('generalPhotos', JSON.stringify(this.generalPhotos));
  },

  renderGeneralGallery() {
    const gallery = document.getElementById('photosGallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    this.generalPhotos.forEach((photo, index) => {
      const div = document.createElement('div');
      div.style.position = 'relative';
      div.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.src = photo.data;
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      img.style.border = '1px solid #D4C29A';
      img.style.transition = 'all 0.2s';

      img.onmouseover = () => {
        img.style.transform = 'scale(1.05)';
        img.style.boxShadow = '0 0 8px rgba(212, 194, 154, 0.3)';
      };

      img.onmouseout = () => {
        img.style.transform = 'scale(1)';
        img.style.boxShadow = 'none';
      };

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.innerHTML = '<i class="fas fa-trash"></i>';
      btnDelete.style.position = 'absolute';
      btnDelete.style.top = '2px';
      btnDelete.style.right = '2px';
      btnDelete.style.background = '#B32117';
      btnDelete.style.color = 'white';
      btnDelete.style.border = 'none';
      btnDelete.style.borderRadius = '4px';
      btnDelete.style.width = '24px';
      btnDelete.style.height = '24px';
      btnDelete.style.display = 'flex';
      btnDelete.style.alignItems = 'center';
      btnDelete.style.justifyContent = 'center';
      btnDelete.style.cursor = 'pointer';
      btnDelete.style.fontSize = '12px';
      btnDelete.style.opacity = '0';
      btnDelete.style.transition = 'opacity 0.2s';
      btnDelete.style.padding = '0';

      div.onmouseover = () => btnDelete.style.opacity = '1';
      div.onmouseout = () => btnDelete.style.opacity = '0';

      btnDelete.onclick = (e) => {
        e.stopPropagation();
        PhotosManager.deleteGeneralPhoto(index);
      };

      div.appendChild(img);
      div.appendChild(btnDelete);
      gallery.appendChild(div);
    });
  },

  updateGeneralCounter() {
    const count = this.generalPhotos.length;
    const photoCountEl = document.getElementById('photoCount');
    if (photoCountEl) {
      photoCountEl.textContent = `${count} foto${count !== 1 ? '(s)' : ''} (Máx: ${this.maxPhotosPerSection})`;
    }
  },

  async addSectionPhoto(section, photoData) {
    if (!this.sectionStorage[section]) {
      this.sectionStorage[section] = [];
    }

    if (this.sectionStorage[section].length >= this.maxPhotosPerSection) {
      showToast(`Máximo de ${this.maxPhotosPerSection} fotos nesta seção atingido!`, 'warning');
      return false;
    }

    this.sectionStorage[section].push({
      id: Date.now() + Math.random(),
      data: photoData,
      timestamp: new Date().toLocaleString('pt-BR')
    });

    try {
      this.saveSection();
      this.renderSection(section);
      return true;
    } catch (error) {
      this.sectionStorage[section].pop();
      showToast('Erro ao salvar foto. Limite de espaço atingido!', 'error');
      return false;
    }
  },

  deleteSectionPhoto(section, index) {
    if (this.sectionStorage[section] && index >= 0 && index < this.sectionStorage[section].length) {
      this.sectionStorage[section].splice(index, 1);
      this.saveSection();
      this.renderSection(section);
    }
  },

  getSectionPhotos(section) {
    return this.sectionStorage[section] || [];
  },

  clearSection(section) {
    if (this.sectionStorage[section]) {
      this.sectionStorage[section] = [];
      this.saveSection();
      this.renderSection(section);
    }
  },

  clearAllSections() {
    this.sectionStorage = {};
    this.saveSection();
    const sections = ['cliente', 'certificado', 'bombas', 'hidrantes', 'alarme', 'extintores', 'sinalizacao', 'conformidade'];
    sections.forEach(section => this.renderSection(section));
  },

  saveSection() {
    localStorage.setItem('sectionPhotos', JSON.stringify(this.sectionStorage));
  },

  renderSection(section) {
    const gallery = document.getElementById(`gallery-${section}`);
    if (!gallery) return;

    gallery.innerHTML = '';
    const photos = this.sectionStorage[section] || [];

    if (photos.length === 0) {
      gallery.style.display = 'none';
      return;
    }

    gallery.style.display = 'grid';
    gallery.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    gallery.style.gap = '8px';
    gallery.style.marginTop = '10px';

    photos.forEach((photo, index) => {
      const photoDiv = document.createElement('div');
      photoDiv.style.cssText = `
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #D4C29A;
        cursor: pointer;
        transition: all 0.2s;
        width: 80px;
        height: 80px;
      `;

      const img = document.createElement('img');
      img.src = photo.data;
      img.alt = `Foto ${index + 1}`;
      img.loading = 'lazy';
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        background: #B32117;
        color: white;
        border: none;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        padding: 0;
      `;

      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        PhotosManager.deleteSectionPhoto(section, index);
      };

      photoDiv.onmouseover = () => {
        photoDiv.style.transform = 'scale(1.05)';
        photoDiv.style.boxShadow = '0 0 8px rgba(212, 194, 154, 0.3)';
        deleteBtn.style.opacity = '1';
      };

      photoDiv.onmouseout = () => {
        photoDiv.style.transform = 'scale(1)';
        photoDiv.style.boxShadow = 'none';
        deleteBtn.style.opacity = '0';
      };

      photoDiv.appendChild(img);
      photoDiv.appendChild(deleteBtn);
      gallery.appendChild(photoDiv);
    });
  },

  getAllPhotos() {
    const allPhotos = [];

    this.generalPhotos.forEach(foto => {
      allPhotos.push({
        section: 'fotos',
        id: foto.id,
        data: foto.data,
        timestamp: foto.timestamp
      });
    });

    Object.keys(this.sectionStorage).forEach(section => {
      this.sectionStorage[section].forEach(foto => {
        allPhotos.push({
          section: section,
          id: foto.id,
          data: foto.data,
          timestamp: foto.timestamp
        });
      });
    });

    return allPhotos;
  },

  clearAll() {
    this.generalPhotos = [];
    this.sectionStorage = {};
    this.saveGeneral();
    this.saveSection();
    this.renderGeneralGallery();
    this.updateGeneralCounter();
    const sections = ['cliente', 'certificado', 'bombas', 'hidrantes', 'alarme', 'extintores', 'sinalizacao', 'conformidade'];
    sections.forEach(section => this.renderSection(section));
  }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  PhotosManager.init();
  PhotosManager.renderGeneralGallery();
  PhotosManager.updateGeneralCounter();

  const sections = ['cliente', 'certificado', 'bombas', 'hidrantes', 'alarme', 'extintores', 'sinalizacao', 'conformidade'];
  sections.forEach(section => PhotosManager.renderSection(section));

  const tabs = document.querySelectorAll('.inspection-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;
      document.querySelectorAll('.inspection-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');

      document.querySelectorAll('.inspection-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

// ===== ABRIR CÂMERA - FOTOS GERAIS =====
async function openNativeCamera(event) {
  event.preventDefault();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.multiple = true;

  input.onchange = async function (e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      let addedCount = 0;

      for (let file of files) {
        const compressedData = await ImageCompressor.compress(file, 600, 600, 0.55);
        const success = await PhotosManager.addGeneralPhoto(compressedData);
        if (success) addedCount++;
      }

      if (addedCount > 0) {
        showToast(`${addedCount} foto(s) adicionada(s)!`);
      }
    }
  };

  input.click();
}

// ===== ABRIR CÂMERA - FOTOS POR SEÇÃO =====
async function openCameraSectionPhotos(e, section) {
  e.preventDefault();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.multiple = true;

  input.onchange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      let addedCount = 0;

      for (let file of files) {
        const compressedData = await ImageCompressor.compress(file, 600, 600, 0.55);
        const success = await PhotosManager.addSectionPhoto(section, compressedData);
        if (success) addedCount++;
      }

      if (addedCount > 0) {
        showToast(`${addedCount} foto(s) adicionada(s) à seção!`);
      }
    }
  };

  input.click();
}

// ===== LIMPAR TODAS AS FOTOS =====
function limparTodasFotos() {
  if (confirm('Tem certeza que deseja limpar TODAS as fotos de todas as seções?')) {
    PhotosManager.clearAll();
    showToast('Todas as fotos foram removidas!');
  }
}

// ============================================
