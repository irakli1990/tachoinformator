export default function Header({
  leftContent,
  rightContent
}) {
  return (
    <header class="app-header">
      <div class="header-left">
        {leftContent}
      </div>

      <div class="header-right">
        {rightContent}
      </div>
    </header>
  );
}