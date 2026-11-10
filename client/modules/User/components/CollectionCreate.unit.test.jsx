import React from 'react';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { reduxRender, screen, fireEvent } from '../../../test-utils';
import { initialTestState } from '../../../testData/testReduxStore';
import CollectionCreate from './CollectionCreate';

jest.mock('../../../i18n');

const mockStore = configureStore([thunk]);
const store = mockStore(initialTestState);

const subject = () => {
  reduxRender(<CollectionCreate />, { store });
};

describe('<CollectionCreate />', () => {
  afterEach(() => {
    store.clearActions();
  });

  it('renders input with maxLength 100 and textarea with maxLength 500', () => {
    subject();
    const nameInput = screen.getByLabelText(/collection name/i);
    const descriptionTextarea = screen.getByLabelText(/description/i);

    expect(nameInput).toHaveAttribute('maxLength', '100');
    expect(descriptionTextarea).toHaveAttribute('maxLength', '500');
  });

  it('disables submit button and shows error when name is empty', () => {
    subject();
    const nameInput = screen.getByLabelText(/collection name/i);
    const submitButton = screen.getByRole('button', {
      name: /create collection/i
    });

    fireEvent.change(nameInput, { target: { value: '' } });

    expect(screen.getByText('Collection name is required')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button and shows error when name is whitespace only', () => {
    subject();
    const nameInput = screen.getByLabelText(/collection name/i);
    const submitButton = screen.getByRole('button', {
      name: /create collection/i
    });

    fireEvent.change(nameInput, { target: { value: '   ' } });

    expect(screen.getByText('Collection name is required')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
