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
const jsonButton = document.getElementById('jsonButton');


// Create a grid using the Muuri framework that allows drag and drop
var grid = new Muuri('.grid', { dragEnabled: true});

main();

function main() {
    addButton.addEventListener('click', addItem);
    deleteButton.addEventListener('click', removeItems);
    jsonButton.addEventListener('click', generateJSON);
    gridElement.addEventListener('click', showSelection);
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
    var id = "1x1";
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

function removeItems() {
    // TODO: Remove items permenantly from grid and array
}

function showSelection() {
    // TODO: UI to show a box is selected
    gridElement.style.color = "red";
}
