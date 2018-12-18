// Container for data to be included in JSON file for config
class GridData {
    constructor(numberOfRows, numberOfColumns) {
        this.numberOfRows = numberOfRows;
        this.numberOfColumns = numberOfColumns;
    }
}

// Create a grid using the Muuri framework that allows drag and drop
var grid = new Muuri('.grid', { dragEnabled: true});

main();

function main() {
    addElementButton();
    createJSONButton();
}

function addElementButton() {
    var addButton = document.createElement("BUTTON");        // Create a <button> element
    var buttonText = document.createTextNode("Add");       // Create a text node
    addButton.appendChild(buttonText);                                // Append the text to <button>
    addButton.addEventListener('click', addItem);
    document.body.appendChild(addButton);     
}

// Create a button "Genderate JSON button"
function createJSONButton() {
    var jsonButton = document.createElement("BUTTON");        // Create a <button> element
    var buttonText = document.createTextNode("Generate JSON");       // Create a text node
    jsonButton.appendChild(buttonText);                                // Append the text to <button>
    jsonButton.onclick = function() {
        generateJSON(); 
    }; 
    document.body.appendChild(jsonButton);     
}

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    var layout = grid.layout;
    var gridData = new GridData(2, 3);
    var jsonString = JSON.stringify(gridData)
    document.write(jsonString)
}

function addItem() {
    var id = "100";
    var fragment = create(
        '<div class="item">' + 
            '<div class="item-content">' + id + '</div>' +
        '</div>');
    document.body.insertBefore(fragment, document.body.childNodes[0]);
}

function create(htmlStr) {
    var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    grid.add(frag.firstChild)
    return frag;
}
