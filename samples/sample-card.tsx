import React from 'react';

interface CardProps {
    title: string;
    subtitle?: string;
    description?: string;
    amount?: number;
    status?: string;
    variant?: 'success' | 'warning' | 'error' | 'neutral';
}

export const Card: React.FC<CardProps> = ({
    title,
    subtitle,
    description,
    amount,
    status,
    variant = 'neutral',
}) => {
    const formattedAmount = amount
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
        : null;

    return (
        <div className={`ds-card ${variant}`}>
            <div className="card-header">
                <h3 className="title">{title}</h3>
                {status && <span className={`badge ${variant}`}>{status}</span>}
            </div>
            {subtitle && <p className="subtitle">{subtitle}</p>}
            {description && <p className="description">{description}</p>}
            {formattedAmount && (
                <div className="amount-section">
                    <span className="amount">{formattedAmount}</span>
                </div>
            )}
        </div>
    );
};

export default Card;
