describe('tests user experience of site', () => {
  it('Checks that the page exists', () => {
    cy.visit('/')
  })
})

describe('tests user experience of site', () => {
  it('Checks that the site has a title', () => {
    cy.visit('/')
    cy.get('title').should('contain', 'Placeholder')
  })
})