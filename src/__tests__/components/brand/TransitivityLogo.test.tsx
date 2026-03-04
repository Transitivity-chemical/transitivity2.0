import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GammaIcon, TransitivityLogo, GammaIconRound } from '@/components/brand/TransitivityLogo';

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

  it('accepts a custom size', () => {
    const { container } = render(<GammaIcon size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses currentColor by default', () => {
    const { container } = render(<GammaIcon />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', 'currentColor');
  });

  it('accepts a custom color', () => {
    const { container } = render(<GammaIcon color="#ff0000" />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', '#ff0000');
  });

  it('applies className to the svg', () => {
    const { container } = render(<GammaIcon className="test-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
  });
});

describe('TransitivityLogo', () => {
  it('renders with text "Transitivity" by default', () => {
    render(<TransitivityLogo />);
    expect(screen.getByText('Transitivity')).toBeInTheDocument();
  });

  it('renders the 2.0 superscript', () => {
    render(<TransitivityLogo />);
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<TransitivityLogo showText={false} />);
    expect(screen.queryByText('Transitivity')).not.toBeInTheDocument();
  });

  it('still renders GammaIcon SVG when text is hidden', () => {
    const { container } = render(<TransitivityLogo showText={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className to the wrapper', () => {
    const { container } = render(<TransitivityLogo className="my-logo" />);
    expect(container.firstElementChild).toHaveClass('my-logo');
  });
});

describe('GammaIconRound', () => {
  it('wraps GammaIcon in a circular div', () => {
    const { container } = render(<GammaIconRound />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.borderRadius).toBe('50%');
  });

  it('sets width and height from size prop', () => {
    const { container } = render(<GammaIconRound size={60} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('60px');
    expect(wrapper.style.height).toBe('60px');
  });

  it('uses default background color #1e3a5f', () => {
    const { container } = render(<GammaIconRound />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBe('rgb(30, 58, 95)');
  });

  it('contains an SVG inside the wrapper', () => {
    const { container } = render(<GammaIconRound />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('scales inner icon to 60% of size', () => {
    const { container } = render(<GammaIconRound size={100} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });
});
