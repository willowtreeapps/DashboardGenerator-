
/*******************************************************************************************************************************************************************
****************************************************** Models *******************************************************************************
*******************************************************************************************************************************************************************/

class GridData {
    constructor(title, titleVisible, description, layout, config) {
        this.title = title;
        this.description = description;
        this.titleVisible = titleVisible;
        this.layout = layout;
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

class GridItem {
    constructor(widgetId, gridId) {
        this.widgetId = widgetId;
        this.gridId = gridId;
    }
}

class Widget {
    constructor(widget) {
        this.row = widget.row;
        this.col = widget.col;
        this.width = widget.width;
        this.height = widget.height;
        this.widget = widget.widget;
        this.job = widget.job;
        this.config = widget.config;
    }
}

/*******************************************************************************************************************************************************************
****************************************************** Global Variables *******************************************************************************
*******************************************************************************************************************************************************************/

let uuid = 0;
let selectedElement;

//used to prevent hidden cells from being included in the generated json
let hiddenCellIDs = [];

//sizes changed depending on size of the page and number of columns in the grid
let baseItemWidth = 300;
let baseItemHeight = 250;
let baseGridSize = 800;

const currentWidgets = [];
const gridItemDict = {};

const itemTypesQueryString = '.item';

const widgetName = 'widget-name';
const widgetsListName = 'widgets';
const jobsListName = 'jobs';

const jobsPlaceholderMessage = 'Select a Job';
const widgetsPlaceholderMessage = 'Select a Widget';

const dimensionNameWidth = 'width';
const dimensionNameHeight = 'height';

const titleInput = document.getElementById("titleInput");
const titleVisibleToggle = document.getElementById("titleVisibleToggle");

const columnInput = document.getElementById("columnInput");
const rowInput = document.getElementById("rowInput");

const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");

const gridElement = document.querySelector('.grid');
const configJSONDisplayElement = document.getElementById('jsonLargeTextArea');

const createButton = document.getElementById("createButton");
const deleteButton = document.getElementById('deleteButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const jsonButton = document.getElementById('jsonButton');
const addButton = document.getElementById('addButton');
const resizeSelectedButton = document.getElementById('resizeSelectedButton');

function getSelectedElementId() {
    return selectedElement.parentElement.getAttribute('id').substr(-1); 
}

const mouseUp = document.addEventListener('mouseup', function(e){
    const target = e.target
    if (target.id !== "jsonLargeTextArea" && e.type === "mouseup") {
        if (target.classList.contains("widget-box")) {
            selectCell(target);
        } else if (target.parentElement.classList.contains("widget-box")) {
            selectCell(target.parentElement);
        } else if (target.nodeName !== "BUTTON") {
            deselectCell();
        }
    }
}); 

// Create a grid using the Muuri framework that allows drag and drop
var grid = new Muuri('.grid',
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
    dragSortPredicate: {
        action: 'swap'
    },
    dragStartPredicate: function (item, e) {
        if (e.deltaTime > 100) {
            return Muuri.ItemDrag.defaultStartPredicate(item, e);            
        } else if (e.isFinal) {
            return Muuri.ItemDrag.defaultStartPredicate(item, e);            
        } 
    }
});

setup();

function setup() {
    titleInput.placeholder = "Enter title";
    columnInput.placeholder = "col";
    rowInput.placeholder = "row";
    resizeWidth.placeholder = "resize width";
    resizeHeight.placeholder = "resize height";

    titleVisibleToggle.addEventListener('click', didToggleTitleVisibility);
    createButton.addEventListener('click', didTapCreateGridItems);
    deleteButton.addEventListener('click', clearGrid);
    deleteSelectedButton.addEventListener('click', removeSelectedCell);
    jsonButton.addEventListener('click', generateJSON);
    addButton.addEventListener('click', addCell);
    resizeSelectedButton.addEventListener('click', didTapResizeSelectedCell);

    hideElement("saveSection");

    checkBowserSupportsFilesAPI();
}

/*******************************************************************************************************************************************************************
****************************************************** Action Methods *******************************************************************************
*******************************************************************************************************************************************************************/

// Toggles the title visibility value that should be in the generated JSON value
function didToggleTitleVisibility() {
    if (titleVisibleToggle.textContent === "Set Visible") {
        setTitleInvisible();
    } else {
        setTitleVisible();
    }
}

// Creates a grid from the inputed column and rows
function didTapCreateGridItems() {
    clearGrid();

    const numberOfColumns = columnInput.value;
    const numberOfRows = rowInput.value;

    updateGridSize(numberOfColumns);

    for (count = 0; count < (numberOfRows * numberOfColumns); count++) {
        addCell();
    }

    addExtraSpaceCells();
    
    grid.refreshItems().layout();
}

// Resizes selected cell
function didTapResizeSelectedCell() {
    const width = Math.max(resizeWidth.value, 1);
    const height = Math.max(resizeHeight.value, 1);

    if (selectedElement) {
        selectedElement.style.width = (width * baseItemWidth) + "px";
        selectedElement.style.height = (height * baseItemHeight) + "px";
        const id = getSelectedElementId()
        const configElement = document.getElementById(itemConfigTextName(id));
        configElement.style.width = (width * baseItemWidth) + "px";
        configElement.style.height = (height * baseItemHeight) + "px";
    }

    grid.refreshItems().layout();
}

// Add a 1x1 cell to the grid 
function addCell(newCellSize = [1, 1], widgetId = -1) {
    const newID = uuid;
    uuid++;
    
    const fragment = generateItemDOMFragment(newID);

    grid.add(fragment.firstChild);
    document.body.insertBefore(fragment, document.body.childNodes[newID]);

    // This is a dictionary that stores the grid Id and widgetId of every widget. This is used later to ensure widget columns and rows are properly set
    let gridLength = grid._items.length;
    let newGridItemId = grid._items[gridLength - 1]._id;
    gridItemDict[newGridItemId] = widgetId;

    // Set Config Placeholder
    const configElement = document.getElementById(itemConfigTextName(newID));
    configElement.placeholder = "config name";

    grid.refreshItems().layout();

    // Resize cell to specified cell size
    const cellElement = document.getElementById("widget-box-" + newID);
    cellElement.style.width = (newCellSize[0] * baseItemWidth) + "px";
    cellElement.style.height = (newCellSize[1] * baseItemHeight) + "px";

    grid.refreshItems().layout();

    return newID;
}

// Remove all items in the grid
function clearGrid() {
    const items = document.querySelectorAll(itemTypesQueryString);
    grid.remove(items);
    items.forEach(item => {
        gridElement.removeChild(item);
    })

    uuid = 0;
    hiddenCellIDs = [];
    selectedElement = null;
}

//Removes the selected cell. If the selected cell is already an 
function removeSelectedCell() {
    if (!isHiddenCell(selectedElement.parentElement)) {
        makeHiddenCell(selectedElement.parentElement);
        return;
    }
    grid.remove([selectedElement], {layout: false});
    gridElement.removeChild(selectedElement);
    selectedElement = null;
}

function deselectCell() {
    if (selectedElement) {
        selectedElement.classList.remove('item-content-selected');
        selectedElement.classList.add('item-content-default');
        selectedElement = null;
        configJSONDisplayElement.value = '';
    }
}

function selectCell(cell) {      
        // If there is already a selectedElement and it is not the newly clicked cell, clear the pervious item
        if (selectedElement) {
            deselectCell()
        } 
    
        // Set the selectedElement to be the new cell 
        selectedElement = cell;
        selectedElement.classList.remove('item-content-default');
        selectedElement.classList.add('item-content-selected');
        // Add the cell's JSON to the display box
        var id = getSelectedElementId();  
        var configJsonString = getItemConfigText(id);
        configJSONDisplayElement.value = configJsonString;
        
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

    clearGrid();

    addWidgetsFromJSON(jsonObject);

    addExtraSpaceCells();

    grid.refreshItems().layout();
}

//Goes through the widget passed in and infers the size of the grid from it
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
    const margin = 10;
    gridElement.style.width = ((baseItemWidth + margin) * numberOfColumns) + "px";
    gridElement.style.height = ((baseItemWidth + margin) * (grid.getItems.length / numberOfColumns)) + "px";
}

function setWidgetIdentityLabel(widgetId, name) {
    let widgetNameLabel = document.getElementById("name-label-" + widgetId);
    let widgetConfigLabel = document.getElementById("config-label-" + widgetId);

    widgetNameLabel.innerHTML = name;
    widgetConfigLabel.innerHTML = currentWidgets[widgetId].config;
}

function setWidgetConfigTextField(widgetId, configText) {
    let configElement = document.getElementById(itemConfigTextName(widgetId));
    configElement.value = configText;    
}

function addWidgetsFromJSON(jsonObject) {
    var configurations = jsonObject.config;
    var widgets = jsonObject.widgets;
    if (!widgets) {
        widgets = jsonObject.layout.widgets;
    }

    widgets.forEach(function(widget, index) {
        if (widget != undefined && jsonObject.config[widget.config] != undefined) {
            const importedWidget = new Widget(widget);
            currentWidgets.push(importedWidget);

            const name = "";
            if (jsonObject.config[widget.config].widgetTitle !== undefined) {
                name = jsonObject.config[widget.config].widgetTitle; 
            } else if (jsonObject.config[widget.config].name !== undefined) {
                name = jsonObject.config[widget.config].name; 
            } else if (jsonObject.config[widget.config].title !== undefined) {
                name = jsonObject.config[widget.config].title; 
            } else if (widget.job !== undefined) {
                name = widget.job; 
            } else if (widget.widget !== undefined) {
                name = widget.widget; 
            } else {
                name = "Name Missing";
            }

            // Just to avoid ambiguity 
            let widgetId = index;
            let newCellSize = [widget.width, widget.height];
            addCell(newCellSize, widgetId);

            let selectWidgetList = getSelectListElement(widgetsListName, widgetId);
            let selectJobList = getSelectListElement(jobsListName, widgetId);

            selectWidgetList.value = widget.widget
            selectJobList.value = widget.job

            // Set the widget Name and Config labels
            setWidgetIdentityLabel(widgetId, name);

            // Set the Widget Config JSON Text Field
            let widgetConfig = currentWidgets[widgetId].config

            let configText = JSON.stringify(configurations[widgetConfig], null, '\t');
            if (configText) {                
                setWidgetConfigTextField(widgetId, configText);
            }
        }
    });
}

//Listener that handles processing the json file the user selects to upload and generate the grid from
function handleFiles(filesList) {
    const file = filesList[0];
    fr = new FileReader(); 
    fr.onload = function(e) {
        var rawLog = fr.result;
        let jsonObject = parseJSONString(rawLog, -1);
        createGridFromJSON(jsonObject);
    };
    fr.readAsText(file);
}

/*******************************************************************************************************************************************************************
****************************************************** JSON Generation *******************************************************************************
*******************************************************************************************************************************************************************/

//Used to be able to get the number of rows a grid should have when generating the JSON
function getRowOfLastVisibleCell() {
    const items = document.querySelectorAll(itemTypesQueryString);
    const numberOfColumns = columnInput.value;
    for(i = items.length - 1; i >= 0; i--) {
        //New index in order to generate JSON with the new order of elements reflacted
        let itemID = items[i].getAttribute('id').substr(-1); 
        if (isIDEmptyCell(itemID)) {
            continue;
        }
        const row = Math.ceil(i / numberOfColumns);
        return row;
    }
}

function getCurrentConfigurations() {
    const configurations = {};
    currentWidgets.forEach(function(widget, index) {
        const configName = widget.config;
        const configText = getItemConfigText(index);
        const configJSONObject = parseJSONString(configText, index);

        configurations[configName] = configJSONObject;
    });
    return configurations;
}

// Build the GridData object and convert it to a JSON string
function generateJSON() {
    grid.synchronize(); //reflect any order changes

    // Not really sure how else to do this.
    // I grab the "top" and "left" coordinates of the element and divide it by the base width/height (+4px of padding). Round it since it sometimes is slightly off and columns won't be non-integers 
    grid._items.forEach(function(item, index) {
        let widgetId = gridItemDict[item._id];
        if (currentWidgets[widgetId]) {
            currentWidgets[widgetId].col = Math.round(item._left / (baseItemWidth + 4) + 1);
            currentWidgets[widgetId].row = Math.round(item._top / (baseItemHeight + 4) + 1); 
        }
    });

    const title = titleInput.value;
    const titleVisible = isTitleVisible();

    const numberOfColumns = parseInt(columnInput.value);
    const numberOfRows = getRowOfLastVisibleCell();

    const layout = new Layout(new GridSize(numberOfColumns, numberOfRows));    
    var configurations = {};

    configurations = getCurrentConfigurations();

    layout.widgets = currentWidgets;

    const description = "";

    const gridData = new GridData(title, titleVisible, description, layout, configurations);

    //TODO: - Limit the width on the generated JSON so horizontal scrolling doesn't get enabled if it's too long
    document.getElementById('json').innerHTML = JSON.stringify(gridData, null, 2);
    showElement("saveSection");
}

//Parses the user-input JSON string per item on the grid, and returns the JSON Object
//generates a message on the page letting the user know if there are any parsing errors while doing this.
function parseJSONString(jsonString, id) {
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
                message = 'gridRow: ' + currentWidgets[id].row + ', gridColumn: ' + currentWidgets[id].col + '  ERROR : ' + err.message + ' : ' + jsonString;
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

//Generates the HTML for a cell in the grid
function generateItemDOMFragment(id) {
    // TODO: variable-ify these strings
    let widgetNameLabel = createLabelHTML("name", id, "Name Missing");
    let widgetConfigLabel = createLabelHTML("config", id, "Config missing");
    let widgetsDropDownList = createDropDownHTML(widgetsListName, widgetsList, id, widgetsPlaceholderMessage);
    let jobsDropDownList = createDropDownHTML(jobsListName, jobsList, id, jobsPlaceholderMessage);
    let configTextField = createConfigTextField(id);
    const fragment = createDOMFragment(
        '<div class="item" id="widget-box-' + id +
         '">' + 
            '<div class="widget-box item-content-default">' + 
                widgetNameLabel +
                widgetConfigLabel + 
                '<div class="dropdown_lists">' +
                    widgetsDropDownList +
                    jobsDropDownList +
                '</div>' +
                '<div class="json-config">' +
                configTextField +
                '</div>' +
            '</div>' +
        '</div>');
    return fragment;
}

function createLabelHTML(type, itemId, placeholderMessage) {
    let html = `<p class="cell-${type}-label" id="${type}-label-${itemId}">${placeholderMessage}</p>`
    return html;
}

//Creates an HTML Select list to be injected into the HTML of each grid item.
function createDropDownHTML(dropDownListTitle, dropDownList, itemID, placeholderMessage) {
    let html = '<select id="' + itemSelectListName(dropDownListTitle, itemID) + 
    `" onchange="handleListChangeEvent(this, ${itemID} + )"` + 
    '>';
    for(index in dropDownList) {
        const itemName = dropDownList[index];
        html+= '<option value="" disabled selected hidden>' + placeholderMessage + '</option>';
        html+= '<option value="' + itemName + '">' + itemName + '</option>';
    }
    html+= '</select>';
    html+= '<br />' ;

    return html;
}

//Creates an HTML config text field to be injected into the HTML of each grid item.
function createConfigTextField(itemID) {
    let textFieldName = itemConfigTextName(itemID);
    let html = `<textarea id="${textFieldName}" type="text" style="resize:none;">` + 
    '</textarea>';
    html+= '<br>';
    html+= '<br>';
    return html;
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

function isTitleVisible() {
    //Title is visible if you can hide it
    return titleVisibleToggle.textContent === "Set Hidden"
}

function setTitleVisible() {
    //Title is visible if you can hide it
    titleVisibleToggle.textContent = "Set Hidden";
}

function setTitleInvisible() {
    //Title is hidden if you can show it
    titleVisibleToggle.textContent = "Set Visible";
}

function isIDEmptyCell(id) {
    return hiddenCellIDs.indexOf(id) >= 0;
}

function isHiddenCell(element) {
    const id = getSelectedElementId();
    const jobsElement = getSelectListElement(jobsListName, id);
    return jobsElement.style.visibility === "hidden";
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

function makeHiddenCell(element) {
    element.style.visibility = "hidden";
    const id = element.getAttribute('id').substr(-1);
    hiddenCellIDs.push(id);
}

//adds the extra space cells that allows the user to move smaller cells into "empty" spaces.
//in reality it is just swapping with an invisible cell
function addExtraSpaceCells() {
    const numberOfColumns = columnInput.value;
    for (let i = 0; i < numberOfColumns; i++) {
        const newID = addCell();
        makeHiddenCell(document.getElementById("widget-box-" + newID));
    }
}

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
function handleListEvent(type, target) {    
    if (type === "mouseup") {
        enableCell(target);        
    } 
}

//Listener used to change the config values in each cell as its being edited in the JSON side view.
function configEditedListener(configJsonDisplayTextArea) {
    const newConfigText = configJsonDisplayTextArea.value;
    if (selectedElement) {
        const id = getSelectedElementId()
        const configElement = document.getElementById(itemConfigTextName(id));
        configElement.value = newConfigText;
    }
}

//Listener that handles when the use selects a new job or widget, and pre-fills the config textfield with a template based on the item selected
function handleListChangeEvent(selectElement, id) {

    /// all of the jobs have the same name as the widgets, just use the widget name 

    const selectedValue = selectElement.options[selectElement.selectedIndex].value;
    const currentlySelectedJobValue = getSelectListElement(widgetsListName, id).options[selectElement.selectedIndex].value;
    if (currentlySelectedJobValue === selectedValue) {//a job has been selected
        const correspondingWidgetValue = widgetsList[widgetsList.indexOf(currentlySelectedJobValue)];
        if (correspondingWidgetValue) {
            const currentlySelectedWidgetElement = getSelectListElement(widgetsListName, id);
            currentlySelectedWidgetElement.value = correspondingWidgetValue;
        }
    }

    const currentlySelectedWidgetValue = getSelectListElement(widgetsListName, id).value;

    const configTemplate = getTemplateForOption(currentlySelectedWidgetValue);
    
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

function getItemConfigName(itemId) {
    const textFieldElement = document.getElementById("config-label-" + itemId);
    const configName = textFieldElement.innerHTML;
    return configName.trim();
}

//Gets the config text from the config HTML textfield box inside a grid item
function getItemConfigText(itemID) {
    const configTextFieldName = itemConfigTextName(itemID);
    const textFieldElement = document.getElementById(configTextFieldName);
    const configName = textFieldElement.value;
    return configName.trim();
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
        return '{}';
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
    'onelogin-locked-accounts' : `{
	"interval": 120000,
	"authName": "onelogin"
}`,
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


const widgetsList = 
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
'sprinthealth',
'sprinthealth-history',
'teamcity-build-queue',
'teamcity-build-status',
'teamcity-space-left',
'teamcity-test-trend',
'test-results',
'testrail_run-count',
'testrail_run-results',
'tracker-burnup',
'warcraft-profile',
'zone-clock'
]

const jobsList = 
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
'sprinthealth',
'sprinthealth-history',
'teamcity_queuestatus',
'teamcity-build-status',
'teamcity-space-left',
'teamcity-test-trend',
'test-results',
'testrail_run-count',
'testrail_run-results',
'tracker-burnup',
'warcraft-profile',
'zone-clock'
]


