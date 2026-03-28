import { X, Tag } from 'lucide-react';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Button from '../../../../../ui/Button';
import Input from '../../../../../ui/Input';

interface TagsFieldProps {
  tagInput: string;
  setTagInput: (value: string) => void;
  tags: string[];
  setValue: TaskFormSetValue;
}

export const TagsField = ({
  tagInput,
  setTagInput,
  tags,
  setValue,
}: TagsFieldProps) => {
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setValue('TAGS', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setValue('TAGS', newTags);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <Tag className="h-4 w-4" /> Теги
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="Введите тег"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" onClick={addTag}>
          +
        </Button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-purple-900"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
