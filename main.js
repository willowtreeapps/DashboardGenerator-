// Container for data to be included in JSON file for config
class GridData {
    constructor(title, titleVisible, layout, widgets) {
        this.title = title;
        this.titleVisible = titleVisible;
        this.layout = layout;
        this.widgets = widgets;
    }
}

class ItemData {
    constructor(col, row, width, height, widget, job, config) {
        this.col = col;
        this.row = row;
        this.width = width;
        this.height = height;
        this.widget = widget, 
        this.job = job;
        this.config = config;
    }
}

class Layout {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }
}

class GridSize {
    constructor(columns, rows) {
        this.columns = columns;
        this.rows = rows;
    }
}

// Array to hold all visible grid elements? (Currently not being used)
var selectedElements = [];

const titleInput = document.getElementById("titleInput");
const titleVisibleToggle = document.getElementById("titleVisibleToggle");
const gridElement = document.querySelector('.grid');
const addButton = document.getElementById('addButton');
const deleteButton = document.getElementById('deleteButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const jsonButton = document.getElementById('jsonButton');
const jsonLabel = document.getElementById('jsonParagraph');

// Create a grid using the Muuri framework that allows drag and drop
var grid = new Muuri('.grid', {
    dragEnabled: true
});

setup();

function setup() {
    titleInput.placeholder = "Enter title";
    titleVisibleToggle.addEventListener('click', toggleTitleVisibility);
    addButton.addEventListener('click', addItem);
    deleteButton.addEventListener('click', removeItems);
    deleteSelectedButton.addEventListener('click', removeSelectedItems);
    jsonButton.addEventListener('click', generateJSON);
    document.addEventListener('click', toggleSelectElement);
}

/* Event Actions */

// Toggle to change title visibility
// TODO: Make a custom button with a state? 
function toggleTitleVisibility() {
    if (titleVisibleToggle.textContent === "Set Visible") {
        titleVisibleToggle.textContent = "Set Hidden";
    } else {
        titleVisibleToggle.textContent = "Set Visible";
    }
}

// Add a grid item to DOM
function addItem() {
    var id = gridElement.children.length + 1;
    var fragment = createDOMFragment(
        '<div class="item">' + 
            '<div class="item-content-default">' + id + '</div>' +
        '</div>');
    grid.add(fragment.firstChild);
    document.body.insertBefore(fragment, document.body.childNodes[0]);
}

// Remove all items in the grid
function removeItems() {
    const items = document.querySelectorAll('.item');
    grid.remove(items);
    items.forEach(item => {
        gridElement.removeChild(item);
    })
}

/* Remove all items within the selectedElements array. 
   TODO: selectedElements is a global variable. Can we make this safer?
*/
function removeSelectedItems() {
    grid.remove(selectedElements);
    selectedElements.forEach(element => {
        gridElement.removeChild(element);
    })
    selectedElements = [];
}

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    let title = titleInput.value;
    let titleVisible = isTitleVisible();
    let layout = new Layout(new GridSize(3, 2));
    let widgets = [];

    var gridData = new GridData(
        titleInput.value, titleVisible, layout, widgets);

    var jsonString = JSON.stringify(gridData)
    jsonLabel.textContent = jsonString;
}

// Add selected item to array and show that it is selected
function toggleSelectElement(event) {
    let items = document.querySelectorAll('.item');

    items.forEach(element => {
        if (event.target === element.firstChild) {
            if (selectedElements.includes(element)) {
                // Element already selected
                let index = selectedElements.indexOf(element);
                selectedElements.splice(index, 1);
                event.target.className = 'item-content-default';
            } else {
                // Element has not yet been selected
                selectedElements.push(element);
                event.target.className = 'item-content-selected';
            }
        }
    })
}

/* Helpers */

function isTitleVisible() {
    return titleVisibleToggle.textContent === "Set Hidden"
}

// Create document fragment for given html string
function createDOMFragment(htmlStr) {
    var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
}
