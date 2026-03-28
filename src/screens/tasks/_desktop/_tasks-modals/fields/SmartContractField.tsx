// components/fields/SmartContractField.tsx
import { FileText } from 'lucide-react';
import { useMemo } from 'react';
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getStringValue } from '../../../../../utils/dataNormalizers';

interface SmartContractFieldProps {
  smartContractSearch: string;
  setSmartContractSearch: (value: string) => void;
  setShowSmartContractDropdown: (value: boolean) => void;
  showSmartContractDropdown: boolean;
  smartContracts: ANY[];
  ufCrmTask: string[];
  setValue: TaskFormSetValue;
}

export const getSmartContractAbbr = (contract: ANY): string => {
  const entityTypeId = contract.EntityTypeID || 0;
  const hex = entityTypeId.toString(16).toLowerCase();
  return `T${hex}`;
};

export const SmartContractSearchField = ({
  smartContractSearch,
  setSmartContractSearch,
  setShowSmartContractDropdown,
  showSmartContractDropdown,
  smartContracts,
  ufCrmTask,
  setValue,
}: SmartContractFieldProps) => {
  const smartContractDropdownRef = useClickOutside(() =>
    setShowSmartContractDropdown(false)
  );
  // Находим выбранный контракт
  const selectedContract = useMemo(() => {
    if (ufCrmTask.length === 0) {
      return null;
    }

    const selectedValue = ufCrmTask[0];
    // Парсим значение в формате "T43c_21"
    const parts = selectedValue.split('_');
    if (parts.length === 2) {
      const contractId = parseInt(parts[1]);
      return smartContracts.find((c) => c.ID === contractId);
    }
    return null;
  }, [ufCrmTask, smartContracts]);

  const handleSmartContractSearchChange = (value: string) => {
    setSmartContractSearch(value);
    setShowSmartContractDropdown(true);
  };

  const filteredSmartContracts = useMemo(() => {
    const base = !smartContractSearch.trim()
      ? smartContracts
      : smartContracts.filter((contract) =>
          getStringValue(contract.Title)
            .toLowerCase()
            .includes(smartContractSearch.toLowerCase())
        );

    return [...base].reverse();
  }, [smartContracts, smartContractSearch]);

  const selectSmartContract = (contract: ANY) => {
    const abbr = getSmartContractAbbr(contract);
    const crmValue = `${abbr}_${contract.ID}`;
    setValue('UF_CRM_TASK', [crmValue]);
    setSmartContractSearch(getStringValue(contract.Title));
    setShowSmartContractDropdown(false);
  };

  return (
    <div className="relative" ref={smartContractDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <FileText className="h-4 w-4" /> Привязка к смарт-процессу
      </label>
      <Input
        placeholder="Выберите смарт-процесс..."
        value={
          smartContractSearch ||
          (selectedContract ? getStringValue(selectedContract.Title) : '')
        }
        onChange={(e) => handleSmartContractSearchChange(e.target.value)}
        onFocus={() => setShowSmartContractDropdown(true)}
      />

      {showSmartContractDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {filteredSmartContracts.length === 0 ? (
            <div className="px-3 py-2 text-gray-500"></div>
          ) : (
            filteredSmartContracts.map((contract) => (
              <button
                key={`${getSmartContractAbbr(contract)}_${contract.ID}`}
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                onClick={() => selectSmartContract(contract)}
              >
                {getStringValue(contract.Title)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
