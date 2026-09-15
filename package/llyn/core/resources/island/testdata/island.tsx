type Props = {
  _prerender: boolean;
  label?: string;
};

export default function TestIsland({ _prerender, label }: Props) {
  return (
    <p data-prerender={String(_prerender)}>
      {label}
    </p>
  );
}
