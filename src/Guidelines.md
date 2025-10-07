# SIUBEN Official Brand Guidelines

## Official Institutional Colors

### Primary Color - Azul noche estrellada (Starry Night Blue)
- **RGB**: R:0 G:56 B:118  
- **HEX**: #003876
- **CMYK**: C:100 M:87 Y:27 K:12
- **PANTONE**: 654 C
- **Usage**: Primary actions, navigation, branding, links

### Secondary Color - Institutional Red
- **RGB**: R:226 G:35 B:26
- **HEX**: #E2231A
- **CMYK**: C:0 M:96 Y:98 K:0
- **Usage**: Accents, important highlights, warnings (use sparingly)

### Supporting Colors
- **White**: #FFFFFF (backgrounds, cards)
- **Dark Gray**: #212529 (main text, headings)
- **Light Gray**: #F8F9FA (secondary backgrounds, subtle elements)

## Logo Usage
- The institutional logo has positive and negative versions (color and black/white)
- SIUBEN acronym version available for specific design pieces from Communications Department
- Always maintain proper spacing and proportions
- Use official logo assets only

## Design Principles
- Maintain government professionalism and accessibility
- Use primary blue (#003876) for all main interactive elements
- Red should be used sparingly and only for important accents
- Ensure proper contrast ratios for accessibility
- Follow Dominican Republic government visual identity standards

## Role-Based Access System

### User Roles

#### 1. Administrador (Administrator)
- **Access Level**: Full system access
- **Responsibilities**: 
  - Create users for the backoffice
  - Complete system administration
  - Full access to all modules
- **Permissions**:
  - Can create users: ✅
  - Can approve requests: ✅
  - Can review requests: ✅
  - Can view reports: ✅
  - Can manage beneficiaries: ✅
- **Test Users**:
  - `admin` / `admin123` (Dr. María Elena Santos)
  - `administrador` / `siuben2025` (Lic. Carlos Rafael Peña)

#### 2. Manager/Supervisor (Manager)
- **Access Level**: Supervision and management
- **Responsibilities**:
  - Chief of analyst roles
  - Review and approve requests
  - Supervise operations
- **Permissions**:
  - Can create users: ❌
  - Can approve requests: ✅
  - Can review requests: ✅
  - Can view reports: ✅
  - Can manage beneficiaries: ✅
- **Test Users**:
  - `manager` / `manager123` (Lic. Ana Patricia Jiménez)
  - `supervisor` / `supervisor123` (Ing. Roberto Carlos Mendoza)

#### 3. Analista (Analyst)
- **Access Level**: Request analysis and review
- **Responsibilities**:
  - Review requests for initial evaluation
  - Submit recommendations to managers
  - Limited system access
- **Permissions**:
  - Can create users: ❌
  - Can approve requests: ❌
  - Can review requests: ✅
  - Can view reports: ❌
  - Can manage beneficiaries: ❌
- **Test Users**:
  - `analista` / `analista123` (Lic. Esperanza María Rodríguez)
  - `operador` / `operador123` (Lic. Juan Miguel Valdez)

### Navigation Access
- **Dashboard**: Available to all roles
- **Beneficiaries**: Administrator and Manager only
- **Requests**: All roles (with different permission levels)
- **Reports**: Administrator and Manager only

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->