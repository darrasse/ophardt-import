// Clubdesk parameters.

var externalEncoding = 'latin1';

function isActiveStatus(status) {
    switch (status) {
        case 'Aktivmitglied':
        case 'Aktivmitglied (Ehepaar)':
        case "Junior 1":
        case "Junior 2":
        case "Junior 2 (>20)":
        case "Flüchtling":
        case "Gastmitglied":
        case "Ehrenmitglied":
            return true;
        default:
            return false;
    }
}

function shouldKeepExternal(row) {
    return isActiveStatus(row['Status']) && row['Lizenz'] != 'Lizenz in anderem Club';
}

// Mappings from clubdesk to Ophardt.

var headerMapping = new Map([
    ['Vorname', 'firstname'],
    ['Nachname', 'lastname'],
    ['Geburtsdatum', 'dateofbirth'],
    ['Geschlecht', 'gender'],
    ['Nationalität', 'nationality1'],
    ['Waffenarm', 'handed'],
]);

var genderMapping = new Map([
    ['weiblich', 'F'],
    ['männlich', 'M'],
]);

var countryMapping = new Map([
    ['Österreich', 'AUT'],
    ['Belgien', 'BEL'],
    ['Weißrussland', 'BLR'],
    ['Kanada', 'CAN'],
    ['China', 'CHN'],
    ['Kroatien', 'CRO'],
    ['Tschechien', 'CZE'],
    ['Spanien', 'ESP'],
    ['Estland', 'EST'],
    ['Finnland', 'FIN'],
    ['Frankreich', 'FRA'],
    ['Großbritannien', 'GBR'],
    ['Deutschland', 'GER'],
    ['Griechenland', 'GRE'],
    ['Hongkong', 'HKG'],
    ['Ungarn', 'HUN'],
    ['Indien', 'IND'],
    ['Irland', 'IRL'],
    ['Irak', 'IRQ'],
    ['Italien', 'ITA'],
    ['Kirgisistan', 'KGZ'],
    ['Süd Korea', 'KOR'],
    ['Libanon', 'LBN'],
    ['Litauen', 'LTU'],
    ['Luxemburg', 'LUX'],
    ['Niederlande', 'NED'],
    ['Norwegen', 'NOR'],
    ['Polen', 'POL'],
    ['Portugal', 'POR'],
    ['Rumänien', 'ROU'],
    ['Südafrika', 'RSA'],
    ['Russland', 'RUS'],
    ['Singapur', 'SGP'],
    ['Schweiz', 'SUI'],
    ['Slowakei', 'SVK'],
    ['Schweden', 'SWE'],
    ['Ukraine', 'UKR'],
    ['USA', 'USA'],
]);

var handedMapping = new Map([
    ['Links', 'L'],
    ['Rechts', 'R'],
]);
