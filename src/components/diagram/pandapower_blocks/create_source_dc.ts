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
    return String(value);
}

export function generateCreateSourceDcCode(
    sourceDcId: number, // A unique ID for the generated source_dc variable
    bus_dc: number,
    vm_pu: number = 1.0,
    name?: string,
    index?: number,
    in_service: boolean = true,
    type?: string,
): string {
    let code = `source_dc_${sourceDcId} = pandapower.create_source_dc(net, bus_dc=${formatPythonValue(bus_dc)}`;

    if (vm_pu !== 1.0) {
        code += `, vm_pu=${formatPythonValue(vm_pu)}`;
    }
    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (type !== undefined) {
        code += `, type=${formatPythonValue(type)}`;
    }

    code += `)`;
    return code;
}