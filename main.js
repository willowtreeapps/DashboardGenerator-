// Container for data to be included in JSON file for config
class GridData {
    constructor(title, titleVisible, layout, widgets, config) {
        this.title = title;
        this.titleVisible = titleVisible;
        this.layout = layout;
        this.widgets = widgets;
        this.config = config;
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
    constructor(col, row, width, height, widget, job, config) {
        this.col = col;
        this.row = row;
        this.width = width;
        this.height = height;
        this.widget = widget;
        this.job = job;
        this.config = config;
    }
}

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
const addButton = document.getElementById('addButton');

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

let selectClicked = false;//prevent grid items from dragging when select list is clicked

// Create a grid using the Muuri framework that allows drag and drop
const grid = new Muuri('.grid', {
    dragEnabled: true,
    layoutOnResize: true,
    layout: createLayout,
    dragStartPredicate: function (item, e) {
        // Start moving the item after the item has been dragged for one second.

        if (e.isFinal) {
            return Muuri.ItemDrag.defaultStartPredicate(item, e);
        }
        // console.log('Drag Start Predicate');
        return !selectClicked;
      }
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
    addButton.addEventListener('click', addCell);

    hideElement("saveSection");

    checkBowserSupportsFilesAPI();
}

/*
****************************************************** Action Methods ******************************************************
*/

// Toggle to change title visibility
// TODO: Make a custom button with a state? 
function toggleTitleVisibility() {
    if (titleVisibleToggle.textContent === "Set Visible") {
        setTitleInvisible();
    } else {
        setTitleVisible();
    }
}

function setTitleVisible() {
    titleVisibleToggle.textContent = "Set Visible";
}

function setTitleInvisible() {
    titleVisibleToggle.textContent = "Set Hidden";
}

// Creates a grid from the inputed column and rows
function createGridItems() {
    removeItems();

    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    for (count = 0; count < (numberOfRows * numberOfColumns); count++) {
        addItem(count);
    }
    
     grid.refreshItems().layout();
}

function addCell() {
    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    const id = grid.getItems().length;
    if (id >= (numberOfRows * numberOfColumns)) {
        //Only allow user to add up to the max amount of cells.
        return;
    }
    addItem(id);
}

// Add a grid item to DOM
function addItem(id) {
    let jobsDropDownHtml = createDropDownHTML('jobs', widgetsAndJobsList, id, jobsPlaceholderMessage);
    let widgetsDropDownList = createDropDownHTML('widgets', widgetsAndJobsList, id, widgetsPlaceholderMessage);
    let configTextField = createConfigTextField(id);
    const fragment = createDOMFragment(
        '<div class="item" id="' + id +
         '">' + 
            '<div class="item-content-default"' +
            '" onmousedown="return handleListEvent(event)"' + 
             ' >' + 
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
****************************************************** Populating From Uploaded JSON ******************************************************
*/

function createGridFromJSON(jsonObject) {
    const title = jsonObject.title;
    const titleVisible = jsonObject.titleVisible;
    const numberOfColumns = jsonObject.layout.gridSize.columns;
    const numberOfRows = jsonObject.layout.gridSize.rows;

    titleInput.value = title;
    if(titleVisible) {
        setTitleVisible();
    } else {
        setTitleInvisible();
    }

    columnInput.value = numberOfColumns;
    rowInput.value = numberOfRows;

    createGridItems()

    for (count = 0; count < (numberOfRows * numberOfColumns); count++) {
        const widget = jsonObject.widgets[count];
        const widgetCol = widget.col;
        const widgetRow = widget.row;
        const widgetWidth = widget.width;
        const widgetHeight = widget.height;
        const widgetJob = widget.job;
        const widgetWidget = widget.widget;
        const widgetConfig = widget.config;

        let selectedJob = getSelectListElement(jobsListName, count);
        let selectedWidget = getSelectListElement(widgetsListName, count);

        selectedJob.value = widgetJob;
        selectedWidget.value = widgetWidget;

        console.log('selected Job: ' + selectedJob);
        console.log('Widget JOB: ' + widgetJob);

        if (widgetConfig && widgetConfig.length > 2) {
            const configElement = document.getElementById(itemConfigTextName(count));
            console.log(configElement);
            configElement.value = widgetConfig;
        }
    }
}

function handleFiles(filesList) {
    const file = filesList[0];
    fr = new FileReader();
    fr.onload = function(e) {
        var rawLog = fr.result;
        let jsonObject = parseJSONString(rawLog, -1, -1);
        createGridFromJSON(jsonObject);
    };
    fr.readAsText(file);
}

  /*
****************************************************** JSON Generation ******************************************************
*/

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    grid.synchronize();//reflect any order changes

    const title = titleInput.value;
    const titleVisible = isTitleVisible();

    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    const layout = new Layout(new GridSize(numberOfColumns, numberOfRows));
    
    const widgets = [];
    const configurations = [];
    const items = document.querySelectorAll('.item');
    
    for(i = 0; i < items.length; i++) {
        //New index in order to generate JSON with the new order of elements reflacted
        let newIndex = items[i].getAttribute('id');

        const column = Math.floor(newIndex % numberOfColumns);
        const row = Math.floor(newIndex / numberOfColumns);
        let selectedJob = getSelectedListElementValue(jobsListName, newIndex);
        let selectedWidget = getSelectedListElementValue(widgetsListName, newIndex);

        if (selectedJob === jobsPlaceholderMessage) {
            selectedJob = '';
        }
        if (selectedWidget === widgetsPlaceholderMessage) {
            selectedWidget = '';
        }

        let configJSONString = getItemConfigText(newIndex);
        let configJSONName;
        if (configJSONString.indexOf('{') != 0) {
            configJSONString = '{' + configJSONString + '}';
        }
        let configJSONMessage = parseJSONString(configJSONString, column, row);
        
        if (!isJSONEmpty(configJSONMessage)) {
            configurations.push(configJSONMessage);
        }

        //TODO: once blocks can merge need to update this to represent how wide or tall the 'final' block is
        const blockWidth = 1;
        const blockHeight = 1;

        const widgetObject = new Widget(column, row, blockWidth, blockHeight, selectedJob, selectedWidget, configJSONString);
        widgets.push(widgetObject);
    }

    const gridData = new GridData(
        title, titleVisible, layout, widgets, configurations);

    document.getElementById('json').innerHTML = JSON.stringify(gridData, null, 2);
    showElement("saveSection");
}

function parseJSONString(jsonString, column, row) {
    let configJSON;
    let message;
    let color;
    try {
        configJSON = JSON.parse(jsonString);
        configJSONName = Object.keys(configJSON)[0];
        message = 'SUCCESS!!!';
        color = 'green'
      }
      catch(err) {
        message = 'gridRow: ' + row + ', gridColumn: ' + column + ' ERROR : ' + err.message;
        color = 'red'
      }
      let jsonMessageElement = document.getElementById("jsonGenerationMessage");
      jsonMessageElement.innerHTML = message;
      jsonMessageElement.style.color = color;

      return configJSON;
}

/*
****************************************************** HTML Generation ******************************************************
*/

function createDropDownHTML(dropDownListTitle, dropDownList, itemID, placeholderMessage) {
    let html = '<select id="' + itemSelectListName(dropDownListTitle, itemID) + 
    '" onmousedown="return handleListEvent(event)"' + 
    '>';
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
****************************************************** Save Generated JSON ******************************************************
*/

function copyTextToClipboard() {
    const text = document.getElementById('json').innerHTML;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
  
    document.body.removeChild(textArea);
  }

/*
****************************************************** Helpers ******************************************************
*/

function handleListEvent(event) {
    const target = event.target;
    const targetType = target.constructor.name;

    console.log('event: ' + event.type);
    console.log('targetType: ' + targetType);

    if (targetType === 'HTMLSelectElement') {
      selectClicked = true;

    } else {
      selectClicked = false;
    }

    console.log('Clicked!: ' + targetType);
}

function checkBowserSupportsFilesAPI() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        input = document.getElementById('input');
        if (!input) {
          alert("Um, couldn't find the fileinput element.");
       }
       else if (!input.files) {
          alert("This browser doesn't seem to support the `files` property of file inputs.");
       }
       else {
            // Great success! All the File APIs are supported.
            console.log("This should work when a file is selected");
       }
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

function isTitleVisible() {
    return titleVisibleToggle.textContent === "Set Hidden"
}

function showElement(elementIDString) {
    const element = document.getElementById(elementIDString);
    element.style.visibility = "visible";
}

function hideElement(elementIDString) {
    const element = document.getElementById(elementIDString);
    element.style.visibility = "hidden";
}

function getSelectedListElementValue(listName, itemID) {
    const listElement = getSelectListElement(listName, itemID);
    const selectedValue = listElement.options[listElement.selectedIndex].text;
    return selectedValue;
}

function getSelectListElement(listName, itemID) {
    const itemSelectedListName = itemSelectListName(listName, itemID);
    const listElement = document.getElementById(itemSelectedListName);
    return listElement;
}

function getItemConfigText(itemID) {
    const configTextFieldName = itemConfigTextName(itemID);
    const textFieldElement = document.getElementById(configTextFieldName);
    const configName = textFieldElement.value;
    return configName;
}

function isJSONEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

function itemSelectListName(baseListName, itemID) {
    const name = baseListName + '_' + itemID;
    return name.trim();
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
