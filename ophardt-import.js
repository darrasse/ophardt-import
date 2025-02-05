// Club member database parameters.

var externalEncoding = 'utf-8';

function shouldKeepExternal(row) {
    return true;
}

// Mappings from club member database to Ophardt.

var headerMapping = new Map();

var genderMapping = new Map();

var countryMapping = new Map();

var handedMapping = new Map();

// Ophardt parameters.

const ophardtEncoding = "utf-16";

const ophardtColumns = [
    'firstname',
    'lastname',
    'dateofbirth',
    'gender',
    'nationality1',
    'handed',
];

const mappings = new Array();

// We don't initialize these right away, as we are likely to override the Maps
// by loading a script that sets a values for a given club managament software.
function initMappings() {
    mappings.push({
        'header': 'gender',
        'missing': new Map(),
        'empty': 0,
        'map': genderMapping,
    });
    mappings.push({
        'header': 'nationality1',
        'missing': new Map(),
        'empty': 0,
        'map': countryMapping,
    });
    mappings.push({
        'header': 'handed',
        'missing': new Map(),
        'empty': 0,
        'map': handedMapping,
    });
}

function shouldKeepOphardt(row) {
    return row['active'] == 1;
}

function getKey(row) {
    key = row['lastname'] + row['firstname'] + row['dateofbirth'];
    return key.charAt(0).toUpperCase() + key.slice(1);
}

// Core logic.

function parseExternalHeaders(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                preview: 1,
                encoding: externalEncoding,
                complete: (results) => { resolve(results.data[0]) }
            }
        );
    })
}

function parseExternal(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                header: true,
                transformHeader: (header) =>
                    headerMapping.has(header) ? headerMapping.get(header) : header,
                encoding: externalEncoding,
                complete: (results) => { resolve(results.data) }
            }
        );
    })
}

function parseExisting(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                header: true,
                encoding: ophardtEncoding,
                complete: (results) => { resolve(results.data) }
            }
        );
    })
}

const externalInput = document.getElementById('external');
externalInput.addEventListener("input", processExternalHeaders);
const externalMap = new Map();

async function processExternalHeaders() {
    const externalFile = externalInput.files[0];
    const externalHeaders = await parseExternalHeaders(externalFile);
    const columnsPresent = new Array();
    const unmatchedHeaders = new Array();
    externalHeaders.forEach(header => {
        if (ophardtColumns.includes(header)) {
            columnsPresent.push(header);
        } else if (headerMapping.has(header)) {
            columnsPresent.push(headerMapping.get(header));
        } else {
            unmatchedHeaders.push(header);
        }
    });
    if (columnsPresent.length < ophardtColumns.length) {
        addMissingHeaderForm(columnsPresent, unmatchedHeaders);
    } else {
        initMappings();
        processExternalContent();
    }
}

function addMissingHeaderForm(columnsPresent, unmatchedHeaders) {
    const form = document.getElementById('missing-headers-form');
    const datalist = document.createElement('datalist');
    datalist.id = 'unmatched-headers';
    unmatchedHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        datalist.appendChild(option);
    });
    form.appendChild(datalist);
    const missingHeaders = ophardtColumns.filter(header => !columnsPresent.includes(header));
    missingHeaders.forEach(header => {
        const label = document.createElement('label');
        label.textContent = header + ': ';
        label.htmlFor = 'missing-header-' + header;
        const input = document.createElement('input');
        input.setAttribute('list', 'unmatched-headers');
        input.id = 'missing-header-' + header;
        input.name = header;
        const container = document.createElement('div');
        container.appendChild(label);
        container.appendChild(input);
        form.appendChild(container);
    });
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Reprocess';
    form.appendChild(submit);
    form.addEventListener('submit', event => {
        event.preventDefault();
        let stillMissing = false;
        missingHeaders.forEach(header => {
            value = document.getElementById('missing-header-' + header).value;
            if (value == '') {
                stillMissing = true;
            }
            headerMapping.set(value, header);
        });
        if (!stillMissing) {
            form.innerHTML = '';
            processExternalHeaders();
        }
    });
    document.getElementById('stats-external').appendChild(form);
}

function applyMapping(row, mapping) {
    const column = mapping['header'];
    const value = row[column];
    if (value == '') {
        mapping['empty'] += 1;
    } else if (mapping['map'].has(value)) {
        row[column] = mapping['map'].get(value);
    } else {
        mapping['missing'].set(value, (mapping['missing'].get(value) || 0) + 1);
    }
}

async function processExternalContent() {
    const externalFile = externalInput.files[0];
    const externalData = await parseExternal(externalFile);
    externalData.forEach(row => {
        if (shouldKeepExternal(row)) {
            mappings.forEach(mapping => {applyMapping(row, mapping);});
            externalMap.set(getKey(row), row);
        }
    });
    const statsDiv = document.getElementById('stats-external');
    statsDiv.innerHTML = `
        <p>Entries in club members file: ${externalData.length} Retained: ${externalMap.size}</p>
    `;
    mappings.forEach(mapping => {
        if (mapping['missing'].size > 0) {
            statsDiv.innerHTML += `
                <p>The following ${mapping['header']} values were not found
                in the mapping: ${mapping['missing'].keys().toArray()}</p>
            `
        }
        if (mapping['empty'] > 0) {
            statsDiv.innerHTML += `
                <p>${mapping['empty']} ${mapping['header']} values were empty</p>
            `
        }
    });

    document.getElementById('existing-div').removeAttribute('hidden');
}

const existingInput = document.getElementById('existing');
existingInput.addEventListener("input", processExisting);
const existingMap = new Map();

async function processExisting() {
    const existingFile = existingInput.files[0];
    const existingData = await parseExisting(existingFile);

    existingData.forEach(row => {
        if (shouldKeepOphardt(row)) {
            existingMap.set(getKey(row), row);
        }
    });
    document.getElementById('stats-existing').innerHTML = `
        <p>Entries in ophardt athletes file: ${existingData.length} Retained: ${existingMap.size}</p>
    `;

    compareFiles();
}

function compareFiles() {
    const unmatchedExternalDiv = document.getElementById('unmatched-external');
    const unmatchedExistingDiv = document.getElementById('unmatched-existing');

    const unmatchedExternalEntries =
        externalMap.values().filter(row => !existingMap.has(getKey(row))).toArray();
    const unmatchedExistingEntries =
        existingMap.values().filter(row => !externalMap.has(getKey(row))).toArray();

    unmatchedExternalDiv.innerHTML = '<h3>Unmatched Club Member Entries:</h3>';
    outputUnmatched(unmatchedExternalEntries, unmatchedExternalDiv);
    unmatchedExistingDiv.innerHTML = '<h3>Unmatched Ophardt Entries:</h3>';
    outputUnmatched(unmatchedExistingEntries, unmatchedExistingDiv);
}

function outputUnmatched(unmatchedEntries, outputDIV) {
    if (unmatchedEntries.length > 0) {
        const csvContent = Papa.unparse(
            unmatchedEntries,
            { delimiter: ';', columns: ophardtColumns }
        );
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        outputDIV.innerHTML += `<pre>${csvContent}</pre>`;
        outputDIV.innerHTML += `
            <a href="${url}" download="unmatched_entries.csv" 
                class="download-link">Download unmatched entries CSV</a>
        `;
    } else {
        outputDIV.innerHTML += '<p>No unmatched entries found.</p>';
    }
}