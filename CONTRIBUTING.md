# Contributing to Bookmark Manager Zero

Thank you for your interest in contributing to Bookmark Manager Zero! This document provides guidelines for beta testers and contributors.

## Table of Contents
- [Beta Testing](#beta-testing)
- [Reporting Issues](#reporting-issues)
- [Suggesting Features](#suggesting-features)
- [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)

## Beta Testing

### Before You Start
1. **Backup Your Bookmarks** - While the extension has safety features, it's always wise to export your Firefox bookmarks before beta testing
2. **Read the README** - Familiarize yourself with all features and known limitations
3. **Join the Discussion** - Check existing issues to see what's already being worked on

### What to Test
- **Basic Operations**: Create, edit, delete bookmarks and folders
- **Drag & Drop**: Move bookmarks between folders
- **Search**: Test with various search terms
- **Duplicate Detection**: Create some duplicates and test the detection/deletion
- **Safety Features**: Try to delete protected folders, create duplicate bookmarks
- **Link Checking**: Test with valid and broken links
- **Export/Import**: Test backup and restore functionality
- **Performance**: Test with your actual bookmark collection size

### Test Scenarios to Try
1. **Small Collection** (< 50 bookmarks)
   - All basic operations
   - UI responsiveness

2. **Medium Collection** (50-500 bookmarks)
   - Search performance
   - Sync speed
   - Duplicate detection time

3. **Large Collection** (500+ bookmarks)
   - Load time
   - Memory usage
   - Operation speed

### Providing Feedback
We value all feedback! When testing, please note:
- What you were trying to do
- What you expected to happen
- What actually happened
- How often it happens (always, sometimes, once)

## Reporting Issues

### Bug Reports
Use the [Bug Report template](../../issues/new?template=bug_report.md) and include:

**Required Information:**
- Extension version (shown in the UI header)
- Firefox version
- Operating system
- Steps to reproduce
- Expected vs. actual behavior

**Helpful Information:**
- Screenshots or screen recordings
- Console errors (F12 → Console tab)
- Number of bookmarks in your collection
- Any error messages shown

**Example of a Good Bug Report:**
```
Title: [BUG] Drag and drop fails when moving to nested folder

Description:
When trying to drag a bookmark into a folder that's nested 3+ levels deep,
the bookmark doesn't move and returns to its original position.

Steps to Reproduce:
1. Create a folder structure: Root > Level 1 > Level 2 > Level 3
2. Try to drag a bookmark from Root into Level 3
3. Release the mouse button
4. Bookmark snaps back to Root

Expected: Bookmark should move to Level 3
Actual: Bookmark returns to original position

Environment:
- Version: Beta v0.1
- Firefox: 122.0
- OS: Windows 11
- Bookmarks: ~200
```

### Performance Issues
If reporting slowness or lag:
- Specify your bookmark collection size
- Note which operation is slow (search, load, delete, etc.)
- Mention your system specs if relevant
- Include console performance data if possible

## Suggesting Features

Use the [Feature Request template](../../issues/new?template=feature_request.md) and include:

1. **Clear Description**: What feature do you want?
2. **Problem Statement**: What problem does it solve?
3. **Use Case**: When would you use this?
4. **Priority**: How important is it to you?

**Example of a Good Feature Request:**
```
Title: [FEATURE] Bookmark tags for better organization

Description:
Add the ability to tag bookmarks with custom labels (e.g., "work", "reference", "tutorial")

Problem:
Currently can only organize by folders, but some bookmarks fit multiple categories.

Use Case:
I want to tag coding tutorials as both "learning" and "javascript" without creating
duplicate bookmarks or complex folder structures.

Benefits:
- More flexible organization
- Multi-category classification
- Better search and filtering options
```

## Code Contributions

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Pull Request Guidelines
- **One feature per PR** - Keep changes focused
- **Update documentation** - README, CHANGELOG, etc.
- **Test thoroughly** - Especially with large bookmark collections
- **Follow code standards** - See below
- **Describe your changes** - What, why, and how

### PR Checklist
Before submitting a PR:
- [ ] Code follows the existing style
- [ ] All features tested in actual Firefox extension
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commit messages are clear

## Development Setup

### Prerequisites
- Firefox Developer Edition (recommended) or Firefox 109+
- Text editor (VS Code, Sublime, etc.)
- Git

### Local Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/Bookmark-Manager-Zero-Webapp.git
cd Bookmark-Manager-Zero-Webapp

# Install the extension in Firefox
# 1. Open Firefox
# 2. Navigate to about:debugging#/runtime/this-firefox
# 3. Click "Load Temporary Add-on..."
# 4. Select manifest.json from the cloned directory
```

### Development Workflow
1. Make changes to source files
2. Reload the extension:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Reload" next to Bookmark Manager Zero
3. Test your changes
4. Check browser console for errors (F12)
5. Repeat as needed

### Testing Your Changes
- **Extension Mode**: Test with actual Firefox bookmarks
- **Preview Mode**: Test at the htmlpreview URL for quick iteration
- **Both Modes**: Ensure features work in both environments where applicable

## Code Standards

### JavaScript Style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Use `const` and `let`, avoid `var`
- Use template literals for strings
- Handle errors gracefully

### Code Organization
```javascript
// Good: Clear, documented, single-purpose
async function deleteBookmark(id) {
  if (!id) {
    console.error('deleteBookmark: No ID provided');
    return;
  }

  try {
    await browser.bookmarks.remove(id);
    console.log(`Bookmark ${id} deleted successfully`);
  } catch (error) {
    console.error(`Failed to delete bookmark ${id}:`, error);
    throw error;
  }
}

// Avoid: Unclear, undocumented, mixed concerns
function del(x) {
  browser.bookmarks.remove(x);
  renderUI();
  checkStuff();
}
```

### HTML/CSS Style
- Semantic HTML elements
- Consistent indentation (2 spaces)
- CSS custom properties for theming
- Material Design principles
- Accessible markup (ARIA labels where needed)

### Git Commit Messages
Follow conventional commit format:
```
feat: Add bookmark import from JSON
fix: Resolve drag-drop issue in nested folders
docs: Update README with new installation steps
chore: Bump version to 0.2
refactor: Simplify duplicate detection logic
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style/formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Questions?

If you have questions about contributing:
1. Check existing [Issues](../../issues) and [Discussions](../../discussions)
2. Create a new [Question Issue](../../issues/new?template=question.md)
3. Reference this guide in your question

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment of any kind
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Unprofessional conduct

## Recognition

All contributors will be recognized in:
- The README.md acknowledgments section
- Release notes for their contributions
- Git commit history

Thank you for helping make Bookmark Manager Zero better!

---

**Questions about this guide?** Open an issue with the "question" label.

**Last Updated:** 2025-01-17
