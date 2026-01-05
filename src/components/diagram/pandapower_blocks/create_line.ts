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
    // For other types, return as string or handle error or throw error
    return String(value);
}

export function generateCreateLineCode(
    lineId: number,
    from_bus: number,
    to_bus: number,
    length_km: number,
    params: {
        std_type: string; // For create_line
    } | {
        r_ohm_per_km: number; // For create_line_from_parameters
        x_ohm_per_km: number;
        c_nf_per_km: number;
        max_i_ka: number;
        // Optional parameters for create_line_from_parameters
        type?: 'ol' | 'cs';
        g_us_per_km?: number; // Default 0.0
        r0_ohm_per_km?: number;
        x0_ohm_per_per_km?: number;
        c0_nf_per_km?: number;
        g0_us_per_km?: number; // Default 0.0
        endtemp_degree?: number;
    },
    name?: string,
    index?: number,
    geodata?: Array<[number, number]>,
    df: number = 1.0,
    parallel: number = 1,
    in_service: boolean = true,
    max_loading_percent?: number,
    alpha?: number,
    temperature_degree_celsius?: number,
    // TDPF parameters
    tdpf?: boolean,
    wind_speed_m_per_s?: number,
    wind_angle_degree?: number,
    conductor_outer_diameter_m?: number,
    air_temperature_degree_celsius?: number,
    reference_temperature_degree_celsius?: number,
    solar_radiation_w_per_sq_m?: number,
    solar_absorptivity?: number,
    emissivity?: number,
    r_theta_kelvin_per_mw?: number,
    mc_joule_per_m_k?: number,
): string {
    let code = `line_${lineId} = `;
    let createFunction = '';
    let commonParams = `net, from_bus=${formatPythonValue(from_bus)}, to_bus=${formatPythonValue(to_bus)}, length_km=${formatPythonValue(length_km)}`;

    if ('std_type' in params) {
        createFunction = 'pandapower.create_line';
        commonParams += `, std_type=${formatPythonValue(params.std_type)}`;
    } else {
        createFunction = 'pandapower.create_line_from_parameters';
        commonParams += `, r_ohm_per_km=${formatPythonValue(params.r_ohm_per_km)}, x_ohm_per_km=${formatPythonValue(params.x_ohm_per_km)}, c_nf_per_km=${formatPythonValue(params.c_nf_per_km)}, max_i_ka=${formatPythonValue(params.max_i_ka)}`;

        if (params.type !== undefined) {
            commonParams += `, type=${formatPythonValue(params.type)}`;
        }
        if (params.g_us_per_km !== undefined && params.g_us_per_km !== 0.0) {
            commonParams += `, g_us_per_km=${formatPythonValue(params.g_us_per_km)}`;
        }
        if (params.r0_ohm_per_km !== undefined) {
            commonParams += `, r0_ohm_per_km=${formatPythonValue(params.r0_ohm_per_km)}`;
        }
        if (params.x0_ohm_per_per_km !== undefined) {
            commonParams += `, x0_ohm_per_km=${formatPythonValue(params.x0_ohm_per_per_km)}`;
        }
        if (params.c0_nf_per_km !== undefined) {
            commonParams += `, c0_nf_per_km=${formatPythonValue(params.c0_nf_per_km)}`;
        }
        if (params.g0_us_per_km !== undefined && params.g0_us_per_km !== 0.0) {
            commonParams += `, g0_us_per_km=${formatPythonValue(params.g0_us_per_km)}`;
        }
        if (params.endtemp_degree !== undefined) {
            commonParams += `, endtemp_degree=${formatPythonValue(params.endtemp_degree)}`;
        }
    }

    code += `${createFunction}(${commonParams}`;

    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (geodata !== undefined && geodata.length > 0) {
        code += `, geodata=${formatPythonValue(geodata)}`;
    }
    if (df !== 1.0) {
        code += `, df=${formatPythonValue(df)}`;
    }
    if (parallel !== 1) {
        code += `, parallel=${formatPythonValue(parallel)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (max_loading_percent !== undefined) {
        code += `, max_loading_percent=${formatPythonValue(max_loading_percent)}`;
    }
    if (alpha !== undefined) {
        code += `, alpha=${formatPythonValue(alpha)}`;
    }
    if (temperature_degree_celsius !== undefined) {
        code += `, temperature_degree_celsius=${formatPythonValue(temperature_degree_celsius)}`;
    }

    // TDPF parameters
    if (tdpf !== undefined) {
        code += `, tdpf=${formatPythonValue(tdpf)}`;
    }
    if (wind_speed_m_per_s !== undefined) {
        code += `, wind_speed_m_per_s=${formatPythonValue(wind_speed_m_per_s)}`;
    }
    if (wind_angle_degree !== undefined) {
        code += `, wind_angle_degree=${formatPythonValue(wind_angle_degree)}`;
    }
    if (conductor_outer_diameter_m !== undefined) {
        code += `, conductor_outer_diameter_m=${formatPythonValue(conductor_outer_diameter_m)}`;
    }
    if (air_temperature_degree_celsius !== undefined) {
        code += `, air_temperature_degree_celsius=${formatPythonValue(air_temperature_degree_celsius)}`;
    }
    if (reference_temperature_degree_celsius !== undefined) {
        code += `, reference_temperature_degree_celsius=${formatPythonValue(reference_temperature_degree_celsius)}`;
    }
    if (solar_radiation_w_per_sq_m !== undefined) {
        code += `, solar_radiation_w_per_sq_m=${formatPythonValue(solar_radiation_w_per_sq_m)}`;
    }
    if (solar_absorptivity !== undefined) {
        code += `, solar_absorptivity=${formatPythonValue(solar_absorptivity)}`;
    }
    if (emissivity !== undefined) {
        code += `, emissivity=${formatPythonValue(emissivity)}`;
    }
    if (r_theta_kelvin_per_mw !== undefined) {
        code += `, r_theta_kelvin_per_mw=${formatPythonValue(r_theta_kelvin_per_mw)}`;
    }
    if (mc_joule_per_m_k !== undefined) {
        code += `, mc_joule_per_m_k=${formatPythonValue(mc_joule_per_m_k)}`;
    }

    code += `)`;
    return code;
}