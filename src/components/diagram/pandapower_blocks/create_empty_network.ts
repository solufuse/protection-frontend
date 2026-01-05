import { isNaN } from 'lodash';

function formatPythonValue(value: any): string {
    if (value === null) { // Handle null explicitly for Python None
        return "None";
    }
    if (typeof value === 'string') {
        return `'${value}'`;
    }
    if (typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return "float('nan')"; // Use float('nan') for NaN in Python
        }
        return String(value);
    }
    // Handle arrays for geodata specifically
    if (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number')) {
        return `[${value.map(coord => `(${coord[0]}, ${coord[1]})`).join(', ')}]`;
    }
    return String(value);
}

export function generateCreateEmptyNetworkCode(
    name: string = '', 
    f_hz: number = 50.0, 
    sn_mva: number = 1.0, 
    add_stdtypes: boolean = true
): string {
    return `net = pandapower.create.create_empty_network(
    name=${formatPythonValue(name)}, 
    f_hz=${formatPythonValue(f_hz)}, 
    sn_mva=${formatPythonValue(sn_mva)}, 
    add_stdtypes=${formatPythonValue(add_stdtypes)}
)`;
}