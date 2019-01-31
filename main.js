
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

let selectedElement;
let uuid = 0;

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

const itemTypesQueryString = '.item';

const jobsListName = 'jobs';
const widgetsListName = 'widgets';

const jobsPlaceholderMessage = 'Select a Job';
const widgetsPlaceholderMessage = 'Select a Widget';

const dimensionNameWidth = 'width';
const dimensionNameHeight = 'height';

//prevent grid items from dragging when select list is clicked
let selectClicked = false;

let baseItemWidth = 200;
let baseItemHeight = 250;
let baseGridSize = 800;

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
    dragSortPredicate: {
        action: 'swap'
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
    resizeWidth.placeholder = "resize width";
    resizeHeight.placeholder = "resize height";

    titleVisibleToggle.addEventListener('click', toggleTitleVisibility);
    createButton.addEventListener('click', createGridItems);
    deleteButton.addEventListener('click', removeItems);
    deleteSelectedButton.addEventListener('click', removeSelectedItem);
    jsonButton.addEventListener('click', generateJSON);
    document.addEventListener('click', toggleSelectElement);
    addButton.addEventListener('click', addCell);
    resizeSelectedButton.addEventListener('click', resizeSelected);

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

function resizeSelected() {
    const width = Math.max(resizeWidth.value, 1);
    const height = Math.max(resizeHeight.value, 1);

    if (selectedElement) {
        selectedElement.style.width = (width * baseItemWidth) + "px";
        selectedElement.style.height = (height * baseItemHeight) + "px";
    }

    grid.refreshItems().layout();
}

// Add a 1x1 cell to the grid if the maximum number of items has not been reached
function addCell() {
    const newID = ++uuid;
    addItem(newID);
    return newID;
}

// Add a grid item to DOM. itemType is used to determine if it should be 2 blocks wide or 2 blocks long
function addItem(id, newCellSize = [1, 1]) {
    const fragment = generateItemDOMFragment(id);
    grid.add(fragment.firstChild);
    document.body.insertBefore(fragment, document.body.childNodes[id]);

    //Set Config Placeholder
    const configElement = document.getElementById(itemConfigTextName(id));
    configElement.placeholder = "config name";

    grid.refreshItems().layout();
    ++uuid;

    //Resize cell
    const cellElement = document.getElementById(id);
    cellElement.style.width = (newCellSize[0] * baseItemWidth) + "px";
    cellElement.style.height = (newCellSize[1] * baseItemHeight) + "px";

    grid.refreshItems().layout();
}

function generateItemDOMFragment(id) {
    let jobsDropDownHtml = createDropDownHTML(jobsListName, jobsList, id, jobsPlaceholderMessage);
    let widgetsDropDownList = createDropDownHTML(widgetsListName, widgetsList, id, widgetsPlaceholderMessage);
    let configTextField = createConfigTextField(id);
    let widthField = createDimensionField(id, dimensionNameWidth);
    let heightField = createDimensionField(id, dimensionNameHeight);
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
        return fragment;
}

// Remove all items in the grid
function removeItems() {
    const items = document.querySelectorAll(itemTypesQueryString);
    grid.remove(items);
    items.forEach(item => {
        gridElement.removeChild(item);
    })

}

//Remove all items within the selectedElement array. 
function removeSelectedItem() {
    grid.remove([selectedElement], {layout: false});
    gridElement.removeChild(selectedElement);
    selectedElement = null;
}

// Add selected item to array and show that it is selected
function toggleSelectElement(event) {
    const items = document.querySelectorAll(itemTypesQueryString);

    items.forEach(element => {
        if (event.target === element.firstChild) {
            if (selectedElement === element) {
                // Element already selected
                deselectItem(element);

            } else {
                selectItem(element);
            }
        }
    })
}

function deselectItem(element) {
    element.firstChild.className = 'item-content-default';
    selectedElement = null;
    configJSONDisplayElement.value = '';
}

function selectItem(element) {
    if (selectedElement && selectedElement != element) {
        deselectItem(selectedElement)
    }
    element.firstChild.className = 'item-content-selected';
    selectedElement = element;

    //If available, display config value in side viewer
    const index = element.getAttribute("id");
    const configJSONString = getItemConfigText(index);
    configJSONDisplayElement.value = configJSONString;
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
    gridElement.style.width = ((baseItemWidth + 10) * numberOfColumns) + "px";
}

function addWidgetsFromJSON(jsonObject) {
    const configurations = jsonObject.config;
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

        if (widgetConfig) {
            const configValue = JSON.stringify(configurations[widgetConfig], null, '\t');
            const configElement = document.getElementById(itemConfigTextName(count));
            if (configValue) {
                configElement.value = configValue;
            }
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

        const column = Math.floor(newIndex % numberOfColumns) + 1;
        const row = Math.floor(newIndex / numberOfColumns) + 1;
        let selectedJob = getSelectedListElementValue(jobsListName, newIndex);
        let selectedWidget = getSelectedListElementValue(widgetsListName, newIndex);

        if (selectedJob === jobsPlaceholderMessage) {
            selectedJob = '';
        }
        if (selectedWidget === widgetsPlaceholderMessage) {
            selectedWidget = '';
        }

        const configJSONName = selectedJob ? selectedJob + "_" + newIndex : "";
        let configJSONString = getItemConfigText(newIndex);
        if (configJSONString.indexOf('{') != 0 && configJSONString.indexOf("\"") >= 0) {
            configJSONString = '{' + configJSONString + '}';
        }
        
        const configJSONObject = parseJSONString(configJSONString, column, row);
        configurations[configJSONName] = configJSONObject;

        const item = grid.getItems()[i];
        
        const blockWidth = Math.floor(item.getWidth() / baseItemWidth);
        const blockHeight = Math.floor(item.getHeight() / baseItemHeight);

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
    let html = '<textarea id="' + textFieldName + '" type="text">' + 
    '</textarea>';
    html+= '<br>' ;
    html+= '<br>' ;
    return html;
}

function createDimensionField(itemID, dimensionName) {
    let dimensionFieldName = cellDimensionFieldName(itemID, dimensionName);
    let html = '<input name="' + dimensionFieldName + '" type="text">';
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

function configEditedListener(configJsonDisplayTextArea) {
    const newConfigText = configJsonDisplayTextArea.value;
    if (selectedElement) {
        const id = selectedElement.getAttribute("id");
        const configElement = document.getElementById(itemConfigTextName(id));
        configElement.value = newConfigText;
    }
}

//Listener that handles when the use selects a new job or widget, and pre-fills the config textfield with a template based on the item selected
function handleListChangeEvent(selectElement, id) {
    const selectedValue = selectElement.options[selectElement.selectedIndex].value;
    const currentlySelectedJobValue = getSelectListElement(jobsListName, id).options[selectElement.selectedIndex].value;
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

function cellDimensionFieldName(itemID, dimensionName) {
    return 'dimension_' + dimensionName + '_' + itemID;
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


