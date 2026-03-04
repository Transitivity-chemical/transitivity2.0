import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  GammaIcon,
  TransitivityLogo,
  GammaIconRound,
} from '@/components/brand/TransitivityLogo';

describe('GammaIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<GammaIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('uses default size of 32', () => {
    const { container } = render(<GammaIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies custom size', () => {
    const { container } = render(<GammaIcon size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses currentColor as default fill color', () => {
    const { container } = render(<GammaIcon />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', 'currentColor');
  });

  it('applies custom color', () => {
    const { container } = render(<GammaIcon color="#ff0000" />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', '#ff0000');
  });

  it('applies className to the SVG', () => {
    const { container } = render(<GammaIcon className="my-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('my-icon');
  });
});

describe('TransitivityLogo', () => {
  it('renders "Transitivity" text by default', () => {
    render(<TransitivityLogo />);
    expect(screen.getByText('Transitivity')).toBeInTheDocument();
  });

  it('renders "2.0" superscript', () => {
    render(<TransitivityLogo />);
    expect(screen.getByText('2.0')).toBeInTheDocument();
    const sup = screen.getByText('2.0');
    expect(sup.tagName).toBe('SUP');
  });

  it('hides text when showText is false', () => {
    render(<TransitivityLogo showText={false} />);
    expect(screen.queryByText('Transitivity')).not.toBeInTheDocument();
  });

  it('renders GammaIcon SVG inside the logo', () => {
    const { container } = render(<TransitivityLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('GammaIconRound', () => {
  it('renders a circular container', () => {
    const { container } = render(<GammaIconRound />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.borderRadius).toBe('50%');
  });

  it('applies default size of 40', () => {
    const { container } = render(<GammaIconRound />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('40px');
    expect(div.style.height).toBe('40px');
  });

  it('applies custom size', () => {
    const { container } = render(<GammaIconRound size={80} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('80px');
    expect(div.style.height).toBe('80px');
  });

  it('applies custom background color', () => {
    const { container } = render(<GammaIconRound bgColor="#ff0000" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('renders the inner GammaIcon at 60% of the container size', () => {
    const { container } = render(<GammaIconRound size={100} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('applies className to the outer container', () => {
    const { container } = render(<GammaIconRound className="round-icon" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('round-icon');
  });
});
