
import { apiRequest } from './client';

export const operations = {
    '+': 'addition',
    '−': 'subtraction',
    '×': 'multiplication',
    '÷': 'division',
};

export const symbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
};

export function startTraining(selected, difficulty, durationSeconds) {
    return apiRequest('/training', {
        method: 'POST',
        body: {
            operations: selected.map((symbol) => operations[symbol]),
            difficulty,
            durationSeconds,
        },
    });
}

export function submitTrainingAnswer(sessionId, questionId, answer) {
    return apiRequest(`/training/${sessionId}/answers`, {
        method: 'POST',
        body: { questionId, answer },
    });
}

export function getTrainingQuestion(sessionId) {
    return apiRequest(`/training/${sessionId}/question`);
}

export function getTrainingSummary(sessionId) {
    return apiRequest(`/training/${sessionId}/summary`);
}

export function formatQuestion(question) {
    if (!question) {
        return '';
    }

    return `${question.left} ${symbols[question.operation]} ${question.right}`;
}
