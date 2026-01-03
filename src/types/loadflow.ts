
export interface StudyCase { 
    id: string; 
    config: string; 
    revision: string; 
}

export interface TransformerResult { 
    Tap: number; 
    LFMW: number; 
    LFMvar: number; 
    kV: number; 
}

export interface LoadflowResult {
    filename: string; 
    is_valid: boolean; 
    mw_flow: number; 
    mvar_flow: number; 
    delta_target: number; 
    is_winner: boolean;
    study_case?: StudyCase; 
    transformers: Record<string, TransformerResult>;
}

export interface LoadflowResponse { 
    status: string; 
    results: LoadflowResult[]; 
    filename?: string; 
    folder?: string;
}
