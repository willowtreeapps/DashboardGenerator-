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
    deleteSelectedButton.addEventListener('click', removeSelectedItems);
    jsonButton.addEventListener('click', generateJSON);
    document.addEventListener('click', toggleSelectElement);
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
function toggleSelectElement(event) {
    for (i=0; i < gridElement.children.length; i++) {
        if (event.target === gridElement.children[i].firstChild) {
            if (selectedElements.includes(gridElement.children[i])) {
                // Element already selected
                selectedElements.splice(i, 1);
                event.target.style.background = '#171717';
            } else {
                // Element has not yet been selected
                selectedElements.push(gridElement.children[i]);
                event.target.style.background = "red";
            }
        }
    }
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
