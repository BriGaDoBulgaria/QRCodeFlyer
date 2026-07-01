// js/brigade-order.js
(() => {
  // глобален масив (достъпен отвън)
  window.importantThings = [];

  // draggable = елементите, които потребителя дръпва (slot-овете)
  const draggableSelector = '.box.slot';
  const dropSelector = '.box.green.empty'; // контейнерите box1..box4 (в твоят HTML са div.box.green.empty в <a id="boxN">)

  const draggables = Array.from(document.querySelectorAll(draggableSelector));
  const drops = Array.from(document.querySelectorAll(dropSelector));

  // helper: ако елементът няма id — сложи уникален
  function ensureId(el) {
    if (!el.id) {
      el.id = 'draggable-' + Math.random().toString(36).slice(2, 9);
    }
    return el.id;
  }

  // Запазваме оригиналния контейнер, за да можем да върнем елемент при размяна/премахване
  draggables.forEach(d => {
    const realDraggable = d;
    ensureId(realDraggable);
    realDraggable.setAttribute('draggable', 'true');
    realDraggable.dataset.origParentSelector = realDraggable.parentElement
      ? getElementSelectorForRestore(realDraggable.parentElement)
      : '';
  });

  // дава селектор/маркер за възстановяване на оригиналното място
  function getElementSelectorForRestore(el) {
    if (el.id) return '#' + el.id;
    if (el.classList && el.classList.contains('navbar-collapse')) return null;
    return null;
  }

  // dragstart
  draggables.forEach(d => {
    d.addEventListener('dragstart', (e) => {
      const dragEl = e.target.closest(draggableSelector) || d;
      const id = ensureId(dragEl);
      e.dataTransfer.setData('text/plain', id);
      dragEl.classList.add('dragging');
    });
    d.addEventListener('dragend', (e) => {
      const dragEl = e.target.closest(draggableSelector) || d;
      dragEl.classList.remove('dragging');
    });
  });

  // allow drop
  drops.forEach(drop => {
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('drag-over');
    });
    drop.addEventListener('dragleave', () => {
      drop.classList.remove('drag-over');
    });

    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag-over');

      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId) {
        console.warn('Няма зареден draggedId в dataTransfer.');
        return;
      }

      const draggedEl = document.getElementById(draggedId);
      if (!draggedEl) {
        console.warn('Не намерих елемент с id', draggedId);
        return;
      }

      // Ако в таргетната кутия вече има .box.slot — върни я
      const existingSlot = drop.querySelector('.box.slot');
      if (existingSlot) {
        const orig = existingSlot.dataset.origParentSelector
          ? document.querySelector(existingSlot.dataset.origParentSelector)
          : null;
        if (orig) {
          orig.appendChild(existingSlot);
        } else {
          document.body.appendChild(existingSlot);
        }
      }

      // Слагаме влачения елемент в тази празна кутия
      drop.appendChild(draggedEl);
      draggedEl.classList.add('placed');

      // обновяваме масива
      updateImportantThings();
    });
  });

  // Обновява window.importantThings според реда на кутии box1..box4
  function updateImportantThings() {
  // взима всички slots според реда на drops
  window.importantThings = drops.map(drop => {
    const slot = drop.querySelector('.box.slot');
    return slot ? slot.textContent.trim() || slot.id : null;
  }).filter(Boolean);

  // записваме в localStorage
  localStorage.setItem('importantThings', JSON.stringify(window.importantThings));

  console.log('[INFO] importantThings обновен:', window.importantThings);
}


const siteBindings = {
  "Времеви период":"../brigades/brigade-year.html",
  "Район на месторабота":"../brigades/brigade-location.html",
  "Сектор на работа":"../brigades/brigade-sector.html",
  "Заплата":"../brigades/brigade-salary.html"
};

// генерира страниците по реда на importantThings
function getOrderedPages() {
  if (!window.importantThings || window.importantThings.length === 0) {
    const stored = localStorage.getItem('importantThings');
    if (stored) {
      try {
        window.importantThings = JSON.parse(stored);
        console.log('[INFO] importantThings възстановен от localStorage:', window.importantThings);
      } catch(e) {
        console.warn('⚠ Неуспешно възстановяване от localStorage:', e);
        window.importantThings = [];
      }
    }
  }

  if (!window.importantThings || window.importantThings.length === 0) {
    console.warn("⚠ Няма подредени елементи — използва се оригиналният ред.");
    return Object.values(siteBindings);
  }

  return window.importantThings.map(name => siteBindings[name]).filter(Boolean);
}



const orderedPages = Object.values(siteBindings);

let currentIndex = 0;

window.goNext = function() {
  const orderedPages = getOrderedPages(); // <-- динамично
  if (currentIndex < orderedPages.length - 1) {
    currentIndex++;
    window.location.href = orderedPages[currentIndex];
  } else {
    window.location.href = "../brigades/brigade-result.html";
  }
};

window.goBackward = function() {
  const orderedPages = getOrderedPages();
  if (currentIndex > 0) {
    currentIndex--;
    window.location.href = orderedPages[currentIndex];
  } else {
    console.log("[INFO] Няма предишна страница.");
  }
};

window.resetBrigadeFlow = function() {
  console.log("Нулиране на структурата...");

  window.importantThings = [];
  localStorage.removeItem('importantThings');

  currentIndex = 0;
  
};


})();
