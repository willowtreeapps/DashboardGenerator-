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

class Widget {
    constructor(col, row, width, height, widget, job) {
        this.col = col;
        this.row = row;
        this.width = width;
        this.height = height;
        this.widget = widget;
        this.job = job;
    }
}

// Array to hold all visible grid elements? (Currently not being used)
const selectedElements = [];

const titleInput = document.getElementById("titleInput");
const titleVisibleToggle = document.getElementById("titleVisibleToggle");

const columnInput = document.getElementById("columnInput");
const rowInput = document.getElementById("rowInput");
const createButton = document.getElementById("createButton");

const gridElement = document.querySelector('.grid');

const deleteButton = document.getElementById('deleteButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const jsonButton = document.getElementById('jsonButton');

const itemWidth = 250;
const itemHeight = 250;

const widgetsAndJobsList = 
[
'appbot-topics',
'appbot-wordcloud',
'apteligent-crashtrend',
'blackduck-stats',
'board-cycle',
'bugsnag-error-occurances',
'bugsnag-error-trend',
'build-status',
'burndown',
'checkmarx-scan-queue',
'checkmarx-top-risks',
'checkmarx-top-scantime',
'checkmarx_stats',
'environment-commit-status',
'google-drive',
'isitup',
'onelogin-locked-accounts',
'pending-pr-count',
'picture-of-the-day',
'security-monkey',
'sentinel-one-inactive',
'sentinel-one-threats',
'sentinel-one',
'sprint-goals',
'sprinthealth-history',
'teamcity-build-queue',
'teamcity-build-status',
'teamcity-test-trend',
'test-results',
'testrail_run-count',
'testrail_run-results',
'tracker-burnup',
'warcraft-profile',
'zone-clock'
]

const jobsListName = 'jobs'
const widgetsListName = 'widgets'

const jobsPlaceholderMessage = 'Select a Job';
const widgetsPlaceholderMessage = 'Select a Widget'

// Create a grid using the Muuri framework that allows drag and drop
const grid = new Muuri('.grid', {
    dragEnabled: false,
    layoutOnResize: true,
    layout: createLayout
});

setup();

function setup() {
    titleInput.placeholder = "Enter title";
    columnInput.placeholder = "col";
    rowInput.placeholder = "row";

    titleVisibleToggle.addEventListener('click', toggleTitleVisibility);
    createButton.addEventListener('click', createGridItems);
    deleteButton.addEventListener('click', removeItems);
    deleteSelectedButton.addEventListener('click', removeSelectedItems);
    jsonButton.addEventListener('click', generateJSON);
    document.addEventListener('click', toggleSelectElement);
}

/*
****************************************************** Action Methods ******************************************************
*/

// Toggle to change title visibility
// TODO: Make a custom button with a state? 
function toggleTitleVisibility() {
    if (titleVisibleToggle.textContent === "Set Visible") {
        titleVisibleToggle.textContent = "Set Hidden";
    } else {
        titleVisibleToggle.textContent = "Set Visible";
    }
}

// Creates a grid from the inputed column and rows
function createGridItems() {
    removeItems();
    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    for (count = 0; count < (numberOfRows * numberOfColumns); count++) {
        addItem();
    }
    
     grid.refreshItems().layout();
}

// Add a grid item to DOM
function addItem() {
    const id = gridElement.children.length
    let jobsDropDownHtml = createDropDownHTML('jobs', widgetsAndJobsList, id, jobsPlaceholderMessage);
    let widgetsDropDownList = createDropDownHTML('widgets', widgetsAndJobsList, id, widgetsPlaceholderMessage);
    let configTextField = createConfigTextField(id);
    const fragment = createDOMFragment(
        '<div class="item">' + 
            '<div class="item-content-default">' + 
            (id + 1) + 
                '<div class="dropdown_lists">' + 
                    jobsDropDownHtml + 
                    widgetsDropDownList + 
                    configTextField +
                '</div>' + 
            '</div>' + 
        '</div>');
    grid.add(fragment.firstChild);
    document.body.insertBefore(fragment, document.body.childNodes[id]);

    const configElement = document.getElementById(itemConfigTextName(id));
    configElement.placeholder = "config name";

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

// Add selected item to array and show that it is selected
function toggleSelectElement(event) {
    const items = document.querySelectorAll('.item');

    items.forEach(element => {
        if (event.target === element.firstChild) {
            if (selectedElements.includes(element)) {
                // Element already selected
                const index = selectedElements.indexOf(element);
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

/*
****************************************************** Layout ******************************************************
*/

function createLayout(items, gridWidth, gridHeight) {
    // The layout data object. Muuri will read this data and position the items
    // based on it.
    const layout = {
      // The layout item slots (left/top coordinates).
      slots: [],
      // The layout's total width.
      width: itemWidth,
      // The layout's total height.
      height: itemHeight,
      // Should Muuri set the grid's width after layout?
      setWidth: true,
      // Should Muuri set the grid's height after layout?
      setHeight: true
    };

    // Calculate the slots.
    
    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;
    const margin = 5;

    let x = margin;
    let y = 0;

    const width = itemWidth;
    const height = itemHeight;

    for (let row = 0; row < numberOfRows; row++) {
        for (let column = 0; column < numberOfColumns; column++) {
            if(column == 0  && row > 0) {
                x = margin
                y += height + margin;
              } else if (column > 0) {
                x += width + margin;
              }
        
            layout.slots.push(x, y);
        }
    }

    // Calculate the layout's total width and height. 
    layout.width = width * numberOfColumns;
    layout.height = height * numberOfRows;

    return layout;
  }

  /*
****************************************************** JSON Generation ******************************************************
*/

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    const title = titleInput.value;
    const titleVisible = isTitleVisible();

    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    const layout = new Layout(new GridSize(numberOfColumns, numberOfRows));
    
    const widgets = [];
    const items = document.querySelectorAll('.item');
    
    items.forEach(function(item, index) {
        let selectedJob = getSelectedListElement(jobsListName, index);
        let selectedWidget = getSelectedListElement(widgetsListName, index);

        if (selectedJob === jobsPlaceholderMessage) {
            selectedJob = ''
        }
        if (selectedWidget === widgetsPlaceholderMessage) {
            selectedWidget = ''
        }

        const column = Math.floor(index % numberOfColumns);
        const row = Math.floor(index / numberOfColumns);

        //TODO: once blocks can merge need to update this to represent how wide or tall the 'final' block is
        const blockWidth = 1;
        const blockHeight = 1;

        const widgetObject = new Widget(column, row, blockWidth, blockHeight, selectedJob, selectedWidget);
        widgets.push(widgetObject);
    })

    const gridData = new GridData(
        titleInput.value, titleVisible, layout, widgets);

    document.getElementById('json').innerHTML = JSON.stringify(gridData, null, 2);
}

/*
****************************************************** HTML Generation ******************************************************
*/

function createDropDownHTML(dropDownListTitle, dropDownList, itemID, placeholderMessage) {
    let html = '<select id="' + itemSelectListName(dropDownListTitle, itemID) + '">';
    for(index in dropDownList) {
        const itemName = dropDownList[index];
        html+= '<option value="" disabled selected hidden>' + placeholderMessage + '</option>'
        html+= '<option value="' + itemName + '">' + itemName + '</option>';
    }
    html+= '</select>';

    return html;
}

function createConfigTextField(itemID) {
    let textFieldName = itemConfigTextName(itemID);
    let html = '<input id="' + textFieldName + '" type="text">' + 
    '</input>';
    return html
}

// Create document fragment for given html string
function createDOMFragment(htmlStr) {
    const frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
}
/*
****************************************************** Helpers ******************************************************
*/

function isTitleVisible() {
    return titleVisibleToggle.textContent === "Set Hidden"
}

function getSelectedListElement(listName, itemID) {
    const itemSelectedListName = itemSelectListName(listName, itemID);
    const listElement = document.getElementById(itemSelectedListName);
    const selectedValue = listElement.options[listElement.selectedIndex].text;
    return selectedValue;
}

function itemSelectListName(baseListName, itemID) {
    const name = baseListName + '_' + itemID;
    console.log(name)
    return name
}

function itemConfigTextName(itemID) {
    return 'config_' + itemID;
}

// // Prints height and witdth of items in pixels
// // TODO: Do math to get column and row size of grid
// function getItemSizes() {
//     const items = document.querySelectorAll('.item');
//     items.forEach(function (item, index) {
//         console.log("Index " + index + ": " + "(" + item.clientWidth + ", " + item.clientHeight +  ")");
//     })
// }
