# Known Contracts

## Template Engine
- <% %> : outer template level
- {% %} : nested template level generated from outer templates

## DAO
- processing acts as async queue lock
- waiting via setTimeout polling is expected behaviour

## Grid
- formulas are stored in attribute 'formula'
- ref/depend build a dependency graph
- clearing a formula must clear refs