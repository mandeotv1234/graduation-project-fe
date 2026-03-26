'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { createSpecification } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import {
  SpecificationDataset,
  SpecificationEntity,
  SpecificationEntityAttribute,
  SpecificationResponse
} from '@/lib/types'
import { SpecificationForm } from '@/app/(main)/teacher/specifications/components/specification-form'

interface CreateSpecificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newSpec: SpecificationResponse) => void
}

export function CreateSpecificationModal({
  open,
  onOpenChange,
  onSuccess
}: CreateSpecificationModalProps) {
  const { callApi, isLoading } = useApi()

  const [name, setName] = useState('')
  const [ddlScript, setDdlScript] = useState('')
  const [description, setDescription] = useState('')
  const [entities, setEntities] = useState<SpecificationEntity[]>([])
  const [datasets, setDatasets] = useState<SpecificationDataset[]>([])

  const emptyAttribute = (
    orderIndex: number
  ): SpecificationEntityAttribute => ({
    attributeName: '',
    dataType: 'VARCHAR(255)',
    description: '',
    isPrimaryKey: false,
    isNullable: true,
    orderIndex
  })

  const emptyEntity = (orderIndex: number): SpecificationEntity => ({
    entityName: '',
    displayName: '',
    description: '',
    orderIndex,
    attributes: [emptyAttribute(1)]
  })

  const normalizeEntities = (items: SpecificationEntity[]) =>
    items.map((entity, entityIndex) => ({
      ...entity,
      entityName: entity.entityName.trim(),
      displayName: entity.displayName?.trim() || entity.entityName.trim(),
      description: entity.description?.trim() || '',
      orderIndex: entityIndex + 1,
      attributes: (entity.attributes ?? []).map((attribute, attrIndex) => ({
        ...attribute,
        attributeName: attribute.attributeName.trim(),
        dataType: attribute.dataType.trim(),
        description: attribute.description?.trim() || '',
        orderIndex: attrIndex + 1
      }))
    }))

  const normalizeDatasets = (items: SpecificationDataset[]) =>
    items.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      orderIndex: index + 1
    }))

  const addEntity = () =>
    setEntities((prev) => [...prev, emptyEntity(prev.length + 1)])

  const removeEntity = (entityIndex: number) => {
    setEntities((prev) =>
      normalizeEntities(prev.filter((_, idx) => idx !== entityIndex))
    )
  }

  const moveEntity = (entityIndex: number, direction: -1 | 1) => {
    setEntities((prev) => {
      const target = entityIndex + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[entityIndex], next[target]] = [next[target], next[entityIndex]]
      return normalizeEntities(next)
    })
  }

  const updateEntity = (
    entityIndex: number,
    field: keyof SpecificationEntity,
    value: string
  ) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex ? { ...entity, [field]: value } : entity
      )
    )
  }

  const addAttribute = (entityIndex: number) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: [
                ...(entity.attributes ?? []),
                emptyAttribute((entity.attributes ?? []).length + 1)
              ]
            }
          : entity
      )
    )
  }

  const updateAttribute = (
    entityIndex: number,
    attributeIndex: number,
    field: keyof SpecificationEntityAttribute,
    value: string | boolean | number
  ) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: (entity.attributes ?? []).map((attribute, aIdx) =>
                aIdx === attributeIndex
                  ? { ...attribute, [field]: value }
                  : attribute
              )
            }
          : entity
      )
    )
  }

  const removeAttribute = (entityIndex: number, attributeIndex: number) => {
    setEntities((prev) =>
      prev.map((entity, idx) =>
        idx === entityIndex
          ? {
              ...entity,
              attributes: (entity.attributes ?? [])
                .filter((_, aIdx) => aIdx !== attributeIndex)
                .map((attribute, aIdx) => ({
                  ...attribute,
                  orderIndex: aIdx + 1
                }))
            }
          : entity
      )
    )
  }

  const addDataset = () => {
    setDatasets((prev) => [
      ...prev,
      {
        name: '',
        dataScript: '',
        orderIndex: prev.length + 1,
        isActive: true
      }
    ])
  }

  const updateDataset = (
    index: number,
    field: keyof SpecificationDataset,
    value: string | boolean | number
  ) => {
    setDatasets((prev) =>
      prev.map((dataset, idx) =>
        idx === index ? { ...dataset, [field]: value } : dataset
      )
    )
  }

  const removeDataset = (index: number) => {
    setDatasets((prev) =>
      normalizeDatasets(prev.filter((_, idx) => idx !== index))
    )
  }

  const moveDataset = (index: number, direction: -1 | 1) => {
    setDatasets((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return normalizeDatasets(next)
    })
  }

  const resetForm = () => {
    setName('')
    setDdlScript('')
    setDescription('')
    setEntities([])
    setDatasets([])
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !ddlScript.trim()) {
      toast.error('Vui lòng nhập tên và DDL script')
      return
    }

    const normalizedEntities = normalizeEntities(entities)
    const invalidEntity = normalizedEntities.find(
      (entity) => !entity.entityName
    )
    if (invalidEntity) {
      toast.error('Vui lòng nhập entityName cho tất cả entities')
      return
    }

    const invalidAttribute = normalizedEntities.find((entity) =>
      (entity.attributes ?? []).some(
        (attribute) => !attribute.attributeName || !attribute.dataType
      )
    )
    if (invalidAttribute) {
      toast.error('Vui lòng nhập đầy đủ attributeName và dataType')
      return
    }

    const normalizedDatasets = normalizeDatasets(datasets)
    const invalidDataset = normalizedDatasets.find((dataset) => !dataset.name)
    if (invalidDataset) {
      toast.error('Vui lòng nhập tên cho tất cả datasets')
      return
    }

    const result = await callApi(
      createSpecification({
        name: name.trim(),
        ddlScript,
        description: description.trim() || undefined,
        entities: normalizedEntities,
        datasets: normalizedDatasets
      })
    )

    if (result.data) {
      toast.success('Tạo đặc tả thành công')
      if (onSuccess) {
        onSuccess(result.data)
      }
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none max-w-[95vw] md:max-w-[1200px] w-full max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        showCloseButton={false}
      >
        {' '}
        <VisuallyHidden>
          <DialogTitle>Tạo đặc tả CSDL</DialogTitle>
          <DialogDescription>
            Form nhập thông tin và sơ đồ CSDL dùng cho bài thi
          </DialogDescription>
        </VisuallyHidden>{' '}
        <SpecificationForm
          mode="create"
          isLoading={isLoading}
          name={name}
          ddlScript={ddlScript}
          description={description}
          entities={entities}
          datasets={datasets}
          onNameChange={setName}
          onDdlScriptChange={setDdlScript}
          onDescriptionChange={setDescription}
          onSubmit={handleCreate}
          onCancel={() => handleOpenChange(false)}
          onAddEntity={addEntity}
          onRemoveEntity={removeEntity}
          onMoveEntity={moveEntity}
          onUpdateEntity={updateEntity}
          onAddAttribute={addAttribute}
          onUpdateAttribute={updateAttribute}
          onRemoveAttribute={removeAttribute}
          onAddDataset={addDataset}
          onUpdateDataset={updateDataset}
          onRemoveDataset={removeDataset}
          onMoveDataset={moveDataset}
        />
      </DialogContent>
    </Dialog>
  )
}
