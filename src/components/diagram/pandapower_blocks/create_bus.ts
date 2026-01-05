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

export function generateCreateBusCode(
    busId: number, // Corresponds to the index returned by pandapower
    vn_kv: number,
    name?: string,
    type: 'b' | 'm' | 'n' = 'b', // 'b': busbar, 'm': muff, 'n': node
    zone?: string,
    in_service: boolean = true,
    max_vm_pu?: number,
    min_vm_pu?: number,
): string {
    let code = `bus_${busId} = pandapower.create_bus(net, vn_kv=${formatPythonValue(vn_kv)}`;

    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (type !== 'b') { // Only add if it's not the default 'b'
        code += `, type=${formatPythonValue(type)}`;
    }
    if (zone !== undefined) {
        code += `, zone=${formatPythonValue(zone)}`;
    }
    if (in_service === false) { // Only add if it's not the default true
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (max_vm_pu !== undefined) {
        code += `, max_vm_pu=${formatPythonValue(max_vm_pu)}`;
    }
    if (min_vm_pu !== undefined) {
        code += `, min_vm_pu=${formatPythonValue(min_vm_pu)}`;
    }

    code += `)`;
    return code;
}