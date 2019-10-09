# Style
This is a full stack project including front and back end.
## Scaffold (mainly)
- app ------------------------------------------------- source code for business
  - assets ---------------------------------------- static source for front end
    - components ---------------------------- components can be reused
    - config ---------------------------------- front end common config
    - context --------------------------------- React context
    - utils ------------------------------------ front end utils
    - index.html ----------------------------- entry template index.html
    - index.tsx ------------------------------- entry to all js* files
  - controller ----------------------------------- node controller api for back end
  - service -------------------------------------- back end service logic
  - router.ts ------------------------------------ back end router config
  - config --------------------------------------- node config folder refer to [Egg](https://eggjs.org/en/basics/config.html)

## Stack
- Front End
  - React
  - TypeScript
  - Webpack
  - Babel
  - ...
- Back End
  - [Egg](https://eggjs.org/en/intro/index.html)

## Code Style
- Use English

- Variable Naming
  ```javascript
  // lower camel case
  // case1 - common virable
  let isLoading = false
  // case2 - function viriable
  function runSql () { ... }

  // word upper case with '-'
  // case1 - constant config
  const APP_NAME = 'nebula-web-console'
  ```

- Event Methods Naming
```javascript
class Example extends React.Component {
  // if the method is defined by compnent itself, use handleXXX naming method:
  handleSave = () => {
    ...
  }
  ...
  render () {
    // if the method is pass from the parent to the component, use onXXX naming method:
    const { onCancel } = this.props
    return (
      <div>
        ...
        <Button onClick={this.handleSave}>Save<Button>
        <Button onClick={onCancel}>Cancel<Button>
      <div>
    )
  }
}
```

- Props Comment Required in `components/` folder
  ```javascript
  interface IProps {
    /**
     * name description
     */
    name: string
    /**
     * isHappy description
     * @default false
     */
    isHappy?: boolean
  }

  class Person extends React.Component<any, IProps> { ... }
  ```

- Other rules refer: https://github.com/airbnb/javascript
## Git Commit Message Format
refer `.commitlint.js`


