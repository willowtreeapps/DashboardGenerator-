// Container for data to be included in JSON file for config
class GridData {
    constructor(numberOfRows, numberOfColumns) {
        this.numberOfRows = numberOfRows;
        this.numberOfColumns = numberOfColumns;
    }
}

// Array to hold all visible grid elements? (Currently not being used)
var selectedElements = [];

const gridElement = document.querySelector('.grid');
const addButton = document.getElementById('addButton');
const deleteButton = document.getElementById('deleteButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const jsonButton = document.getElementById('jsonButton');

// Create a grid using the Muuri framework that allows drag and drop
var grid = new Muuri('.grid', { dragEnabled: true});

main();

function main() {
    addButton.addEventListener('click', addItem);
    deleteButton.addEventListener('click', removeItems);
    deleteSelectedButton.addEventListener('click', removeSelectedItems, selectedElements);
    jsonButton.addEventListener('click', generateJSON);
    document.addEventListener('click', selectElement, event);
}

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    var layout = grid.layout;
    var gridData = new GridData(2, 3);
    var jsonString = JSON.stringify(gridData)
    document.write(jsonString)
}

// Add a grid item to DOM
function addItem() {
    var id = gridElement.children.length + 1;
    var fragment = createDOMFragment(
        '<div class="item">' + 
            '<div class="item-content">' + id + '</div>' +
        '</div>');
    grid.add(fragment.firstChild);
    document.body.insertBefore(fragment, document.body.childNodes[0]);

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

// Remove all items in the grid
function removeItems() {
    const items = document.querySelectorAll('.item');
    grid.remove(items);
    for (var i=0; i<items.length; i++) {
        gridElement.removeChild(items[i]);
    }   
}

// Add selected item to array and show that it is selected
function selectElement(event) {
    for (i=0; i < gridElement.children.length; i++) {
        if (event.target === gridElement.children[i].firstChild) {
         selectedElements.push(gridElement.children[i]);
         event.target.style.background = "red";
        }
    }
}

// TODO: Not working. Remove selected items from the grid
function removeSelectedItems(selectedItems) {
    grid.remove(selectedItems);
    for (var i=0; i<selectedItems.length; i++) {
        gridElement.removeChild(selectedItems[i].outterHTML);
    }   
    selectedItems = [];
}
