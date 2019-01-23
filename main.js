
/*******************************************************************************************************************************************************************
****************************************************** Models *******************************************************************************
*******************************************************************************************************************************************************************/


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
    constructor(id, col, row, width, height, widget, job, config) {
        this.id = id;
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
    constructor(col, row, width, height, job, widget, config) {
        this.col = col;
        this.row = row;
        this.width = width;
        this.height = height;
        this.job = job;
        this.widget = widget;
        this.config = config;
    }
}

/*******************************************************************************************************************************************************************
****************************************************** Global Variables *******************************************************************************
*******************************************************************************************************************************************************************/

let selectedElements = [];
let uuid = 0;

const titleInput = document.getElementById("titleInput");
const titleVisibleToggle = document.getElementById("titleVisibleToggle");

const columnInput = document.getElementById("columnInput");
const rowInput = document.getElementById("rowInput");

const gridElement = document.querySelector('.grid');

const createButton = document.getElementById("createButton");
const deleteButton = document.getElementById('deleteButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const jsonButton = document.getElementById('jsonButton');
const addButton = document.getElementById('addButton');
const combineSelectedButton = document.getElementById('combineSelectedButton');

const itemWidth = 250;
const itemHeight = 250;

const itemTypesQueryString = '.item';

const jobsListName = 'jobs';
const widgetsListName = 'widgets';

const jobsPlaceholderMessage = 'Select a Job';
const widgetsPlaceholderMessage = 'Select a Widget';

//prevent grid items from dragging when select list is clicked
let selectClicked = false;

// Create a grid using the Muuri framework that allows drag and drop
const grid = new Muuri('.grid',
{
    dragEnabled: true,
    layoutOnResize: true,
    layoutDuration: 400,
    layoutEasing: 'ease',
    dragContainer: document.body,
    layout: {
        fillGaps: true,
        horizontal: false,
        alignRight: false,
        alignBottom: false,
        rounding: true
    },
    dragSort: function () {
        return [grid];
    },
    dragStartPredicate: function (item, e) {
        if (e.isFinal) {
            return Muuri.ItemDrag.defaultStartPredicate(item, e);
        }
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
    combineSelectedButton.addEventListener('click', combineSelected);

    hideElement("saveSection");

    checkBowserSupportsFilesAPI();
}

/*******************************************************************************************************************************************************************
****************************************************** Action Methods *******************************************************************************
*******************************************************************************************************************************************************************/



// Toggle to change title visibility
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

    updateGridSize(numberOfColumns);

    for (count = 0; count < (numberOfRows * numberOfColumns); count++) {
        addItem(count);
    }
    
    grid.refreshItems().layout();
}

//combine 2 items to create an extra long or extra wide cell
//TODO: need to get cell positions to dynamically allow the creation of cells that are 3 units wide or 3 units tall
function combineSelected() {
    if(selectedElements.length != 2) {
        return;
    }
    const items = grid.getItems(selectedElements);
    const itemOne = items[0];
    const itemTwo =  items[1];

    if (!areAdjacent(itemOne, itemTwo)) {
        console.log('NOT ADJACENT!');
        return;
    }

    const newCellOrientation = newCellOrientationForItems(itemOne, itemTwo);

    removeSelectedItems();

    const newID = ++uuid;
    addItem(newID, newCellOrientation);
}

function newCellOrientationForItems(firstItem, secondItem) {
    const orderedItems = orderItems(firstItem, secondItem);
    const itemOne = orderedItems[0];
    const itemTwo = orderedItems[1];

    const firstItemRect = itemOne.getElement().getBoundingClientRect();
    const secondItemRect = itemTwo.getElement().getBoundingClientRect();

    const widthOne = itemOne.getWidth();
    const widthTwo = itemTwo.getWidth();
    const heightOne = itemOne.getHeight();
    const heightTwo = itemTwo.getHeight();

    const sameRow = firstItemRect.top === secondItemRect.top;
    const sameCol = firstItemRect.left === secondItemRect.left;

    const maxWidth = Math.max(widthOne, widthTwo) / itemWidth;
    const maxHeight = Math.max(heightOne, heightTwo) / itemHeight;

    let newCellOrientation = [maxWidth, maxHeight];
    if (sameRow) {
        const widthLevel = Math.floor(widthOne + widthTwo) / itemWidth;
        newCellOrientation[0] = widthLevel;
    } else if (sameCol) {
        const heightLevel = Math.floor(heightOne + heightTwo) / itemHeight;
        newCellOrientation[1] = heightLevel;
    }
    return newCellOrientation;
}

function areAdjacent(firstItem, secondItem) {
    const orderedItems = orderItems(firstItem, secondItem);
    const itemOne = orderedItems[0];
    const itemTwo = orderedItems[1];

    const firstItemRect = itemOne.getElement().getBoundingClientRect();
    const secondItemRect = itemTwo.getElement().getBoundingClientRect();

    const widthOne = itemOne.getWidth();
    const heightOne = itemOne.getHeight();

    const marginOne = itemOne.getMargin();
    const marginTwo = itemTwo.getMargin();

    const sameRow = firstItemRect.top === secondItemRect.top;
    const sameCol = firstItemRect.left === secondItemRect.left;

    if (sameRow) {
        const expectedStart = Math.floor(firstItemRect.left + widthOne + marginOne.right + marginTwo.left);
        const actualStart = Math.floor(secondItemRect.left);
        return expectedStart == actualStart;
    } else if (sameCol) {
        const expectedStart = Math.floor(firstItemRect.top + heightOne + marginOne.bottom + marginTwo.top);
        const actualStart = Math.floor(secondItemRect.top);
        return expectedStart == actualStart;
    }
    return false;
}

//Helper function that orders 2 items so the first is more to the left/top than the other
function orderItems(firstItem, secondItem) {
    let itemOne = firstItem;
    let itemTwo = secondItem;

    let firstItemRect = itemOne.getElement().getBoundingClientRect();
    let secondItemRect = itemTwo.getElement().getBoundingClientRect();
    //Item One should always be the the left/top of itemTwo
    if (firstItemRect.left < secondItemRect.left) {
        itemOne = firstItem;
        itemTwo = secondItem;
    } else if (firstItemRect.top < secondItemRect.top) {
        itemOne = firstItem;
        itemTwo = secondItem;
    } else {
        itemOne = secondItem;
        itemTwo = firstItem;
    }
    return [itemOne, itemTwo];
}

// Add a 1x1 cell to the grid if the maximum number of items has not been reached
function addCell() {
    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    const totalCellsNum = grid.getItems().length;
    if (totalCellsNum >= (numberOfRows * numberOfColumns)) {
        //Only allow user to add up to the max amount of cells.
        return;
    }
    const newID = ++uuid;
    addItem(newID);
}

// Add a grid item to DOM. itemType is used to determine if it should be 2 blocks wide or 2 blocks long
function addItem(id, newCellSize = [1, 1]) {
    let jobsDropDownHtml = createDropDownHTML(jobsListName, widgetsAndJobsList, id, jobsPlaceholderMessage);
    let widgetsDropDownList = createDropDownHTML(widgetsListName, widgetsAndJobsList, id, widgetsPlaceholderMessage);
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

    //Set Config Placeholder
    const configElement = document.getElementById(itemConfigTextName(id));
    configElement.placeholder = "config name";

    grid.refreshItems().layout();
    ++uuid;

    //Resize cell
    const cellElement = document.getElementById(id);
    cellElement.style.width = (newCellSize[0] * itemWidth) + "px";
    cellElement.style.height = (newCellSize[1] * itemHeight) + "px";

    grid.refreshItems().layout();
}

// Remove all items in the grid
function removeItems() {
    const items = document.querySelectorAll(itemTypesQueryString);
    grid.remove(items);
    items.forEach(item => {
        gridElement.removeChild(item);
    })
}

//Remove all items within the selectedElements array. 
function removeSelectedItems() {
    grid.remove(selectedElements, {layout: false});
    selectedElements.forEach(element => {
        gridElement.removeChild(element);
    })
    selectedElements = [];
}

// Add selected item to array and show that it is selected
function toggleSelectElement(event) {
    const items = document.querySelectorAll(itemTypesQueryString);

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


/*******************************************************************************************************************************************************************
****************************************************** Populating From Uploaded JSON *******************************************************************************
*******************************************************************************************************************************************************************/

//Creates a grid from an already-complete json generated from the Dashboard
function createGridFromJSON(jsonObject) {
    const title = jsonObject.title;
    const titleVisible = jsonObject.titleVisible;
    let numberOfColumns;
    let numberOfRows;
    const gridSize = jsonObject.layout.gridSize;
    if (gridSize) {
        numberOfColumns = gridSize.columns;
        numberOfRows = gridSize.rows;
    } else {
        const gridSize = getMaxGridSize(jsonObject.layout.widgets);
        numberOfColumns = gridSize[0];
        numberOfRows = gridSize[1];
    }

    updateGridSize(numberOfColumns);

    titleInput.value = title;
    if(titleVisible) {
        setTitleVisible();
    } else {
        setTitleInvisible();
    }

    columnInput.value = numberOfColumns;
    rowInput.value = numberOfRows;

    removeItems();

    addWidgetsFromJSON(jsonObject);

    grid.refreshItems().layout();
}

function getMaxGridSize(widgetsJSONArray) {
    let maxCol = 3;
    let maxRow = 3;
    for (i = 0; i < widgetsJSONArray.length; i++) {
        const widget = widgetsJSONArray[i];
        const widgetColLimit = widget.col + (widget.width - 1);
        const widgetRowLimit = widget.row + (widget.height - 1);
        if (widgetColLimit > maxCol) {
            maxCol = widgetColLimit;
        }
        if (widgetRowLimit > maxRow) {
            maxRow = widgetRowLimit;
        }
    }
    return [maxCol, maxRow];
}

function updateGridSize(numberOfColumns) {
    gridElement.style.width = ((itemWidth + 10) * numberOfColumns) + "px";
}

function addWidgetsFromJSON(jsonObject) {
    let widgets = jsonObject.widgets;
    if (!widgets) {
        widgets = jsonObject.layout.widgets;
    }
    for (count = 0; count < widgets.length; count++) {
        const widget = widgets[count];
        const widgetCol = widget.col;
        const widgetRow = widget.row;
        const widgetWidth = widget.width;
        const widgetHeight = widget.height;
        const widgetJob = widget.job;
        const widgetWidget = widget.widget;
        const widgetConfig = widget.config;

        const newCellSize = [widgetWidth, widgetHeight];
        addItem(count, newCellSize);

        let selectedJob = getSelectListElement(jobsListName, count);
        let selectedWidget = getSelectListElement(widgetsListName, count);

        selectedJob.value = widgetJob;
        selectedWidget.value = widgetWidget;

        if (widgetConfig && widgetConfig.length > 2) {
            const configElement = document.getElementById(itemConfigTextName(count));
            configElement.value = widgetConfig;
        }
    }
}

//Listener that handles processing the json file the user selects to upload and generate the grid from
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

/*******************************************************************************************************************************************************************
****************************************************** JSON Generation *******************************************************************************
*******************************************************************************************************************************************************************/


// Build the GridData object and convert it to a JSON string
function generateJSON() {
    grid.synchronize();//reflect any order changes

    const title = titleInput.value;
    const titleVisible = isTitleVisible();

    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    const layout = new Layout(new GridSize(numberOfColumns, numberOfRows));
    
    const widgets = [];
    const configurations = {};
    const items = document.querySelectorAll(itemTypesQueryString);
    
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

        const configJSONName = selectedJob;
        let configJSONString = getItemConfigText(newIndex);
        if (configJSONString.indexOf('{') != 0 && configJSONString.indexOf("\"") >= 0) {
            configJSONString = '{' + configJSONString + '}';
        }
        
        const configJSONObject = parseJSONString(configJSONString, column, row);
        console.log('JSON NAME : ' + configJSONName);
        console.log('JSON : ' + configJSONObject);
        configurations[configJSONName] = configJSONObject;

        const item = grid.getItems()[i];
        
        const blockWidth = Math.floor(item.getWidth() / itemWidth);
        const blockHeight = Math.floor(item.getHeight() / itemHeight);

        const widgetObject = new Widget(column, row, blockWidth, blockHeight, selectedJob, selectedWidget, configJSONName);
        widgets.push(widgetObject);
    }

    const gridData = new GridData(
        title, titleVisible, layout, widgets, configurations);

    document.getElementById('json').innerHTML = JSON.stringify(gridData, null, 2);
    showElement("saveSection");
}

//Parses the user-input JSON string per item on the grid, and returns the JSON Object
//generates a message on the page letting the user know if there are any parsing errors while doing this.
function parseJSONString(jsonString, column, row) {
    let configJSON;
    let message = 'SUCCESS!!!';
    let color = 'green';
    let success = false;
    if (!jsonString && jsonString.trim().length <= 0) {
        console.log('empty JSON String');
    } else {
        configJSON = jsonString;
        if (typeof configJSON =='object') {
            console.log('already a JSON object : ' + configJSON);
        } else {
            try {
                configJSON = JSON.parse(jsonString);
            } catch(err) {
                message = 'gridRow: ' + row + ', gridColumn: ' + column + '  ERROR : ' + err.message + ' : ' + jsonString;
                color = 'red';
            }
        }
    }
    
    let jsonMessageElement = document.getElementById("jsonGenerationMessage");
    jsonMessageElement.innerHTML = message;
    jsonMessageElement.style.color = color;

    return configJSON;
}

/*******************************************************************************************************************************************************************
****************************************************** HTML Generation *******************************************************************************
*******************************************************************************************************************************************************************/


//Creates an HTML Select list to be injected into the HTML of each grid item.
function createDropDownHTML(dropDownListTitle, dropDownList, itemID, placeholderMessage) {
    let html = '<select id="' + itemSelectListName(dropDownListTitle, itemID) + 
    '" onmousedown="return handleListEvent(event)"' + 
    '" onchange="handleListChangeEvent(this, ' + itemID + ')"' + 
    '>';
    for(index in dropDownList) {
        const itemName = dropDownList[index];
        html+= '<option value="" disabled selected hidden>' + placeholderMessage + '</option>'
        html+= '<option value="' + itemName + '">' + itemName + '</option>';
    }
    html+= '</select>';

    return html;
}

//Creates an HTML config text field to be injected into the HTML of each grid item.
function createConfigTextField(itemID) {
    let textFieldName = itemConfigTextName(itemID);
    let html = '<textarea id="' + textFieldName + '" type="text">' + 
    '</textarea>';
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

/*******************************************************************************************************************************************************************
****************************************************** Save Generated JSON *******************************************************************************
*******************************************************************************************************************************************************************/

//Copies the generated JSON displayed on the page to the clipboard so the user can then paste it into their file to use.
//TODO: This would be better if the button could just download a .json file with the generated JSON.
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

/*******************************************************************************************************************************************************************
****************************************************** Helpers *******************************************************************************
*******************************************************************************************************************************************************************/

//Helper function to see what the accessible properties of an object are
function printObjectProperties(object) {
    console.log('printing all properties for object: ' + object);
    for (let name in object) {
        if (object.hasOwnProperty(name)) {
            console.log(name + " = " + object[name]);
        }
    }
}

//Listener that handles the mousedown event on each grid item to be able to set the selectClicked bool
//selectClicked is used to prevent the grid item from scrolling when the user goes to select a new list value
function handleListEvent(event) {
    const target = event.target;
    const targetType = target.constructor.name;

    //Debugging prints
    // console.log('event: ' + event.type);
    // console.log('targetType: ' + targetType);
    // console.log('Clicked!: ' + targetType);

    const safeTargetsList = ['HTMLSelectElement', 'HTMLInputElement', 'HTMLTextAreaElement'];
    if(safeTargetsList.indexOf(targetType) >= 0) {
      selectClicked = true;
    } else {
      selectClicked = false;
    }
}

//Listener that handles when the use selects a new job or widget, and pre-fills the config textfield with a template based on the item selected
function handleListChangeEvent(selectElement, id) {
    const selectedValue = selectElement.options[selectElement.selectedIndex].value;
    const configTemplate = getTemplateForOption(selectedValue);
    
    const configElement = document.getElementById(itemConfigTextName(id));
    configElement.value = configTemplate;
}

//Helper that checks that the browser supports the File API code used to upload the JSON file
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

//Makes an element visible
function showElement(elementIDString) {
    const element = document.getElementById(elementIDString);
    element.style.visibility = "visible";
}

//Makes an element invisible
function hideElement(elementIDString) {
    const element = document.getElementById(elementIDString);
    element.style.visibility = "hidden";
}

//Gets the selected value of a select HTML list
function getSelectedListElementValue(listName, itemID) {
    const listElement = getSelectListElement(listName, itemID);
    return listElement.value;
}

//Gets the select HTML list element itself
function getSelectListElement(listName, itemID) {
    const itemSelectedListName = itemSelectListName(listName, itemID);
    const listElement = document.getElementById(itemSelectedListName);
    return listElement;
}

//Gets the config text from the config HTML textfield box inside a grid item
function getItemConfigText(itemID) {
    const configTextFieldName = itemConfigTextName(itemID);
    const textFieldElement = document.getElementById(configTextFieldName);
    const configName = textFieldElement.value;
    return configName.trim();
}

function isJSONEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

//Helper to determine what the name of a select HTML list element is for a given grid item id
function itemSelectListName(baseListName, itemID) {
    const name = baseListName + '_' + itemID;
    return name.trim();
}

//Helper to determine what the name of a config HTML textbox is for a given grid item id
function itemConfigTextName(itemID) {
    return 'config_' + itemID;
}

/*******************************************************************************************************************************************************************
****************************************************** Config Templates *******************************************************************************
*******************************************************************************************************************************************************************/

//Helper that returns the config template decided below for a selected value in the jobs or widgets select list.
function getTemplateForOption(selectedValue) {
    const configTemplate = configTemplatesDict[selectedValue];
    if (!configTemplate) {
        return '';
    }
    return configTemplate;
}

const configTemplatesDict = {
    'appbot-topics' : 'enter config template',
    'appbot-wordcloud' : '',
    'apteligent-crashtrend' : '',
    'blackduck-stats' : '',
    'board-cycle' : '',
    'bugsnag-error-occurances' : '',
    'bugsnag-error-trend' : '',
    'build-status' : '',
    'burndown' : '',
    'checkmarx-scan-queue' : '',
    'checkmarx-top-risks' : '',
    'checkmarx-top-scantime' : '',
    'checkmarx_stats' : '',
    'environment-commit-status' : '',
    'google-drive' : '',
    'isitup' : '',
    'onelogin-locked-accounts' : '',
    'pending-pr-count' : '',
    'picture-of-the-day' : '',
    'security-monkey' : '',
    'sentinel-one-inactive' : '',
    'sentinel-one-threats' : '',
    'sentinel-one' : '',
    'sprint-goals' : '',
    'sprinthealth-history' : '',
    'teamcity-build-queue' : '',
    'teamcity-build-status' : '',
    'teamcity-test-trend' : '',
    'test-results' : '',
    'testrail_run-count' : '',
    'testrail_run-results' : '',
    'tracker-burnup' : '',
    'warcraft-profile' : '',
    'zone-clock' : ''
}


/*******************************************************************************************************************************************************************
****************************************************** Widgets And Jobs List Templates *******************************************************************************
*******************************************************************************************************************************************************************/


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


